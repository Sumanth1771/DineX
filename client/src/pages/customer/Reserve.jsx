import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createBooking,
  createPaymentOrder,
  getMenu,
  getTimeSlots,
  verifyPayment,
} from "../../services/bookingApi";
import { useAuth } from "../../context/AuthContext";

const money = (paise) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const displayDate = (key) => {
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
};

const parseDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(date.getTime()) || date.getFullYear() !== +year ||
    date.getMonth() + 1 !== +month || date.getDate() !== +day ? null : `${year}-${month}-${day}`;
};

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = resolve;
  script.onerror = () => reject(new Error("Could not load payment checkout."));
  document.body.appendChild(script);
});

export default function Reserve() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [menu, setMenu] = useState([]);
  const [slots, setSlots] = useState([]);
  const [draft] = useState(() => {
    const stored = sessionStorage.getItem("dinex-reservation-draft");
    if (!stored) return null;
    sessionStorage.removeItem("dinex-reservation-draft");
    return JSON.parse(stored);
  });
  const [date, setDate] = useState(() => draft?.date || displayDate(todayKey()));
  const [slotId, setSlotId] = useState(() => draft?.slotId || "");
  const [guests, setGuests] = useState(() => draft?.guests || 2);
  const [quantities, setQuantities] = useState(() => draft?.quantities || {});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMenu(), getTimeSlots()])
      .then(([items, availableSlots]) => {
        setMenu(items);
        setSlots(availableSlots);
        if (availableSlots.length) setSlotId((current) => current || availableSlots[0]._id);
      })
      .catch(() => setError("We could not load today’s menu. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => menu.filter((item) => quantities[item._id] > 0)
    .map((item) => ({ ...item, quantity: quantities[item._id] })), [menu, quantities]);
  const total = selected.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const changeQuantity = (id, amount) => setQuantities((current) => ({
    ...current, [id]: Math.max(0, Math.min(100, (current[id] || 0) + amount)),
  }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const bookingDateKey = parseDate(date);
    if (!bookingDateKey) return setError("Use date format DD/MM/YYYY.");
    if (!slotId) return setError("Choose a time slot.");
    if (!selected.length) return setError("Add at least one meal to continue.");
    if (!isAuthenticated) {
      sessionStorage.setItem("dinex-reservation-draft", JSON.stringify({ date, slotId, guests, quantities }));
      navigate("/login", { state: { returnTo: "/reserve" } });
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createBooking({
        bookingDateKey, timeSlotId: slotId, guests: Number(guests),
        items: selected.map((item) => ({ menuItemId: item._id, quantity: item.quantity })),
        notes: "",
      });
      await loadRazorpay();
      const order = await createPaymentOrder(booking._id);
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: "DineX", description: `Booking ${booking.bookingNumber}`, order_id: order.orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#f4b749" },
        handler: async (response) => {
          await verifyPayment(booking._id, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          navigate("/dashboard");
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      checkout.on("payment.failed", () => setSubmitting(false));
      checkout.open();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not start booking.");
      setSubmitting(false);
    }
  };

  if (loading) return <main className="reserve-page grid min-h-screen place-items-center text-white">Loading the menu…</main>;

  return (
    <main className="reserve-page min-h-screen text-white">
      <header className="reserve-header mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="brand-lockup">Dine<span>X</span></Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#a99ea0] sm:inline">Build your Uncle Mess visit</span>
          <button onClick={() => setCartOpen(true)} className="cart-pill">Cart <b>{selected.reduce((sum, item) => sum + item.quantity, 0)}</b></button>
        </div>
      </header>
      <form onSubmit={submit} className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="reserve-heading">
          <p className="landing-kicker">MAKE IT YOURS</p>
          <h1>Choose your moment.</h1>
          <p>Pick a slot, select your meal, and we’ll keep your table ready.</p>
        </div>
        {error && <div role="alert" className="reserve-alert">{error}</div>}
        <section className="reserve-layout">
          <div className="space-y-8">
            <div className="reserve-panel">
              <div className="reserve-panel-title"><span>01</span><div><h2>When are you coming?</h2><p>We’ll have your table ready.</p></div></div>
              <div className="reserve-fields">
                <label>Date<input value={date} onChange={(e) => setDate(e.target.value)} placeholder="DD/MM/YYYY" inputMode="numeric" /></label>
                <label>Guests<select value={guests} onChange={(e) => setGuests(+e.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i ? "guests" : "guest"}</option>)}</select></label>
              </div>
              <label className="reserve-label">Time slot</label>
              <div className="slot-grid">{slots.map((slot) => <button type="button" key={slot._id} onClick={() => setSlotId(slot._id)} className={`slot-option ${slotId === slot._id ? "selected" : ""}`}><strong>{slot.startTime}</strong><span>{slot.endTime} · {slot.name}</span></button>)}</div>
            </div>
            <div>
              <div className="reserve-panel-title mb-5"><span>02</span><div><h2>What are you craving?</h2><p>Fresh, filling, and made the Uncle Mess way.</p></div></div>
              <div className="meal-grid">{menu.map((item) => <article className="meal-card" key={item._id}><div className="meal-card-top"><span>{item.category}</span><b>{money(item.sellingPrice)}</b></div><h3>{item.name}</h3><p>{item.description}</p><div className="meal-actions"><span>{quantities[item._id] || 0} added</span><div><button type="button" onClick={() => changeQuantity(item._id, -1)} disabled={!quantities[item._id]}>−</button><button type="button" onClick={() => changeQuantity(item._id, 1)}>+</button></div></div></article>)}</div>
            </div>
          </div>
          <aside className="reserve-cart"><p className="landing-kicker">03 · YOUR CART</p><h2>Ready when you are.</h2>{selected.length ? selected.map((item) => <div className="cart-line" key={item._id}><span>{item.name}<small>{item.quantity} × {money(item.sellingPrice)}</small></span><b>{money(item.quantity * item.sellingPrice)}</b></div>) : <p className="cart-empty">Your chosen meals will appear here.</p>}<div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="landing-button w-full" disabled={submitting || !selected.length}>{submitting ? "Opening secure checkout…" : isAuthenticated ? "Reserve & pay" : "Continue to sign in"} <span>↗</span></button><small className="cart-note">You’ll only sign in at the final booking step.</small></aside>
        </section>
      </form>
      {cartOpen && <button className="cart-drawer-backdrop" aria-label="Close cart" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(e) => e.stopPropagation()}><button className="cart-close" onClick={() => setCartOpen(false)}>×</button><p className="landing-kicker">YOUR CART</p><h2>{selected.length ? `${selected.length} meal${selected.length > 1 ? "s" : ""}` : "Nothing yet"}</h2>{selected.map((item) => <div className="cart-line" key={item._id}><span>{item.name}<small>{item.quantity} × {money(item.sellingPrice)}</small></span><b>{money(item.quantity * item.sellingPrice)}</b></div>)}<div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div></aside></button>}
    </main>
  );
}
