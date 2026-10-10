
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBooking,
  createPaymentOrder,
  getMenu,
  getMyBookings,
  getTimeSlots,
  verifyPayment,
  cancelBooking,
} from "../../services/bookingApi";
import { useAuth } from "../../context/AuthContext";
import heroImage from "../../assets/hero.png";

const money = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

const localDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateKey) => {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
};

const parseDisplayDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());

  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Could not load payment checkout."));

    document.body.appendChild(script);
  });

export default function CustomerDashboard() {
  const { user, logout } = useAuth();

  const [menu, setMenu] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [date, setDate] = useState(formatDateForDisplay(localDateKey()));
  const [slotId, setSlotId] = useState("");
  const [guests, setGuests] = useState(2);
  const [quantities, setQuantities] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("book");

  const selectedItems = useMemo(
    () =>
      menu
        .filter((item) => (quantities[item._id] || 0) > 0)
        .map((item) => ({
          ...item,
          quantity: quantities[item._id],
        })),
    [menu, quantities]
  );

  const totalPaise = selectedItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0
  );

  const refreshBookings = useCallback(async () => {
    const result = await getMyBookings();
    setBookings(result);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [menuItems, timeSlots, myBookings] = await Promise.all([
          getMenu(),
          getTimeSlots(),
          getMyBookings(),
        ]);

        if (!active) return;

        setMenu(menuItems);
        setSlots(timeSlots);
        setBookings(myBookings);

        if (timeSlots.length > 0) {
          setSlotId(timeSlots[0]._id);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load DineX. Please refresh the page."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const changeQuantity = (id, amount) => {
    setQuantities((current) => {
      const next = Math.max(
        0,
        Math.min(100, (current[id] || 0) + amount)
      );

      return { ...current, [id]: next };
    });
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!slotId) {
      setError("Please select a time slot.");
      return;
    }

    const bookingDateKey = parseDisplayDate(date);

    if (!bookingDateKey) {
      setError("Enter a valid date in DD/MM/YYYY format.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please select at least one food item.");
      return;
    }

    setSubmitting(true);

    try {
      const booking = await createBooking({
        bookingDateKey,
        timeSlotId: slotId,
        guests: Number(guests),
        items: selectedItems.map((item) => ({
          menuItemId: item._id,
          quantity: item.quantity,
        })),
        notes: "",
      });

      await loadRazorpay();

      const order = await createPaymentOrder(booking._id);

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "DineX",
        description: `Booking ${booking.bookingNumber}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        notes: {
          bookingNumber: booking.bookingNumber,
        },
        theme: {
          color: "#d4a64b",
        },
        handler: async (response) => {
          try {
            await verifyPayment(booking._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setNotice(
              `Booking ${booking.bookingNumber} confirmed!`
            );
            setQuantities({});
            setActiveTab("bookings");
            await refreshBookings();
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Payment verification is pending. Check your bookings before paying again."
            );

            try {
              await refreshBookings();
            } catch {
              // Keep the payment status message visible.
            }
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setNotice(
              "Checkout closed. Your booking hold may remain active until it expires."
            );
            setSubmitting(false);
            refreshBookings().catch(() => {});
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
            "Payment failed. Your temporary booking hold will expire automatically."
        );
        setSubmitting(false);
      });

      checkout.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not start your booking. Please try again."
      );
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setError("");
    setNotice("");

    try {
      await cancelBooking(bookingId);
      setNotice("Booking cancelled.");
      await refreshBookings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel this booking."
      );
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="animate-pulse text-slate-300">
          Loading DineX...
        </p>
      </main>
    );
  }

  return (
    <main className="dine-customer min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-2xl font-black tracking-tight">
              Dine<span className="text-amber-400">X</span>
            </p>
            <p className="text-xs text-slate-400">
              Reserve your table. Enjoy your meal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:block">
              Hi, {user?.name || "there"}
            </span>
            <button
              onClick={logout}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="dine-hero mb-8 overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/15 via-slate-900 to-slate-900 p-6 sm:p-10">
          <div className="dine-hero-copy">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              Welcome to Uncle Mess
            </p>
            <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
              Good food, your table, ready when you arrive.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Choose your meal, reserve a slot, and pay securely
              through checkout.
            </p>
          </div>
          <div className="dine-hero-art" aria-hidden="true">
            <div className="dine-orbit dine-orbit-one" />
            <div className="dine-orbit dine-orbit-two" />
            <img src={heroImage} alt="" />
            <span>BOOK<br />EAT<br />REPEAT</span>
          </div>
          <div className="dine-hero-actions mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("book")}
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300"
            >
              Book a table
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className="rounded-xl border border-white/20 px-5 py-3 font-semibold hover:bg-white/10"
            >
              My bookings
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
          >
            {notice}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("book")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "book"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400"
            }`}
          >
            Book a table
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === "bookings"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400"
            }`}
          >
            My bookings
          </button>
        </div>

        {activeTab === "book" ? (
          <form
            onSubmit={handleBooking}
            className="grid gap-6 lg:grid-cols-[1fr_340px]"
          >
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <h2 className="text-xl font-bold">
                  01. Your reservation
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm text-slate-300">
                    Date
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="\d{2}/\d{2}/\d{4}"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white outline-none focus:border-amber-400"
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Format: DD/MM/YYYY
                    </span>
                  </label>

                  <label className="text-sm text-slate-300">
                    Guests
                    <select
                      value={guests}
                      onChange={(event) =>
                        setGuests(Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white outline-none focus:border-amber-400"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (number) => (
                          <option key={number} value={number}>
                            {number} {number === 1 ? "guest" : "guests"}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="text-sm text-slate-300">
                    Time slot
                    <select
                      value={slotId}
                      onChange={(event) => setSlotId(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white outline-none focus:border-amber-400"
                    >
                      {slots.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                          {slot.name} ({slot.startTime}–{slot.endTime})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {slots.length === 0 && (
                  <p className="mt-4 text-sm text-amber-300">
                    No time slots are available yet.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-amber-300">02. The menu</p>
                    <h2 className="mt-1 text-2xl font-bold">
                      Pick your favourites
                    </h2>
                  </div>
                  <span className="text-sm text-slate-400">
                    {menu.length} items
                  </span>
                </div>

                {menu.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400">
                    The menu is empty. Ask the restaurant owner to add
                    available items.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {menu.map((item) => {
                      const quantity = quantities[item._id] || 0;

                      return (
                        <article
                          key={item._id}
                                className="dine-card flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-300/40"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                                  {item.category}
                                </p>
                                <h3 className="mt-2 text-lg font-bold">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="whitespace-nowrap font-bold text-amber-300">
                                {money(item.sellingPrice)}
                              </p>
                            </div>

                            {item.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                              Quantity
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                aria-label={`Remove one ${item.name}`}
                                disabled={quantity === 0}
                                onClick={() =>
                                  changeQuantity(item._id, -1)
                                }
                                className="h-9 w-9 rounded-lg border border-white/15 text-lg disabled:opacity-30"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-semibold">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Add one ${item.name}`}
                                onClick={() =>
                                  changeQuantity(item._id, 1)
                                }
                                className="h-9 w-9 rounded-lg bg-amber-400 text-lg font-bold text-slate-950"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="dine-summary rounded-2xl border border-amber-300/20 bg-slate-900 p-5 sm:p-6">
                <p className="text-sm font-semibold text-amber-300">
                  03. Order summary
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  Your meal
                </h2>

                <div className="mt-5 space-y-4">
                  {selectedItems.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Your selection will appear here.
                    </p>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-slate-400">
                            {item.quantity} × {money(item.sellingPrice)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {money(item.sellingPrice * item.quantity)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="my-5 border-t border-white/10" />

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total</span>
                  <span className="text-2xl font-black text-amber-300">
                    {money(totalPaise)}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Your booking is held temporarily while payment is
                  completed. The server verifies the payment before
                  confirming your reservation.
                </p>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !slotId ||
                    selectedItems.length === 0 ||
                    slots.length === 0
                  }
                  className="mt-6 w-full rounded-xl bg-amber-400 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Processing..."
                    : `Reserve & pay ${money(totalPaise)}`}
                </button>
              </div>
            </aside>
          </form>
        ) : (
          <section>
            <div className="mb-5">
              <p className="text-sm text-amber-300">Your reservations</p>
              <h2 className="mt-1 text-2xl font-bold">
                Booking history
              </h2>
            </div>

            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center">
                <p className="text-lg font-semibold">
                  No bookings yet
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Your reservations will appear here.
                </p>
                <button
                  onClick={() => setActiveTab("book")}
                  className="mt-5 rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
                >
                  Book your first meal
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const canCancel =
                    ["pending_payment", "confirmed"].includes(
                      booking.bookingStatus
                    ) && booking.paymentStatus !== "paid";

                  return (
                    <article
                      key={booking._id}
                      className="dine-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-400">
                            BOOKING REFERENCE
                          </p>
                          <h3 className="mt-1 text-lg font-bold">
                            {booking.bookingNumber}
                          </h3>
                          <p className="mt-2 text-sm text-slate-300">
                            {formatDateForDisplay(booking.bookingDateKey)} ·{" "}
                            {booking.timeSlot?.name || "Time slot"}
                            {booking.timeSlot?.startTime
                              ? ` (${booking.timeSlot.startTime}–${booking.timeSlot.endTime})`
                              : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            Table:{" "}
                            {booking.table?.tableNumber || "Assigned"} ·{" "}
                            {booking.guests} guests
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-300">
                            {money(booking.totalAmountPaise)}
                          </p>
                          <p className="mt-2 text-xs text-slate-300">
                            {booking.bookingStatus.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Payment: {booking.paymentStatus}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4">
                        {booking.items?.map((item, index) => (
                          <div
                            key={`${booking._id}-${index}`}
                            className="flex justify-between gap-3 py-1 text-sm text-slate-300"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>{money(item.totalPricePaise)}</span>
                          </div>
                        ))}
                      </div>

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="mt-4 rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10"
                        >
                          Cancel booking
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </section>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} DineX · Powered by Uncle Mess
      </footer>
    </main>
  );
}
