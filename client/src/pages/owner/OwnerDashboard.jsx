
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  getOwnerDashboard,
  getOwnerBookings,
  getManageMenu,
  getManageTables,
  getManageTimeSlots,
  createOwnerMenuItem,
  updateOwnerMenuItem,
  archiveOwnerMenuItem,
  createOwnerTable,
  updateOwnerTable,
  createOwnerTimeSlot,
  updateOwnerTimeSlot,
} from "../../services/ownerApi";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "bookings", label: "Bookings" },
  { id: "menu", label: "Menu" },
  { id: "tables", label: "Tables" },
  { id: "slots", label: "Time slots" },
];

const money = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const readable = (value = "") =>
  String(value).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const statusClass = (status = "") => {
  if (["paid", "confirmed", "completed", "active"].includes(status)) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (["cancelled", "expired", "failed", "refunded", "inactive"].includes(status)) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
};

function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
        String(value || "").toLowerCase()
      )}`}
    >
      {readable(value || "unknown")}
    </span>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111b2e] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 break-words text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    category: "Meals",
    sellingPrice: "",
    costPrice: "",
    sortOrder: "0",
  });

  const [tableForm, setTableForm] = useState({
    tableNumber: "",
    capacity: "2",
    location: "",
  });

  const [slotForm, setSlotForm] = useState({
    name: "",
    startTime: "12:00",
    endTime: "14:00",
    maxBookings: "10",
    sortOrder: "0",
  });

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const [
        dashboardData,
        bookingData,
        menuData,
        tableData,
        slotData,
      ] = await Promise.all([
        getOwnerDashboard(),
        getOwnerBookings(),
        getManageMenu(),
        getManageTables(),
        getManageTimeSlots(),
      ]);

      setDashboard(dashboardData);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setTables(Array.isArray(tableData) ? tableData : []);
      setTimeSlots(Array.isArray(slotData) ? slotData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load the owner dashboard. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const runAction = async (action, successMessage) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await loadDashboard(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "The operation failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const submitMenuItem = async (event) => {
    event.preventDefault();

    const sellingRupees = Number(menuForm.sellingPrice);
    const costRupees = Number(menuForm.costPrice);

    if (
      !menuForm.name.trim() ||
      !menuForm.category.trim() ||
      !Number.isFinite(sellingRupees) ||
      !Number.isFinite(costRupees) ||
      sellingRupees < 0 ||
      costRupees < 0
    ) {
      setError("Enter a name, category and valid non-negative prices.");
      return;
    }

    await runAction(
      () =>
        createOwnerMenuItem({
          name: menuForm.name.trim(),
          description: menuForm.description.trim(),
          category: menuForm.category.trim(),
          sellingPrice: Math.round(sellingRupees * 100),
          costPrice: Math.round(costRupees * 100),
          sortOrder: Number(menuForm.sortOrder) || 0,
          isAvailable: true,
        }),
      "Menu item added successfully."
    );

    setMenuForm({
      name: "",
      description: "",
      category: "Meals",
      sellingPrice: "",
      costPrice: "",
      sortOrder: "0",
    });
  };

  const toggleAvailability = (item) =>
    runAction(
      () =>
        updateOwnerMenuItem(item._id, {
          isAvailable: !item.isAvailable,
        }),
      `Menu item marked ${item.isAvailable ? "unavailable" : "available"}.`
    );

  const restoreMenuItem = (item) =>
    runAction(
      () =>
        updateOwnerMenuItem(item._id, {
          isActive: true,
          isAvailable: true,
        }),
      "Menu item restored."
    );

  const archiveMenuItem = (item) => {
    if (!window.confirm(`Archive "${item.name}"?`)) return;
    runAction(
      () => archiveOwnerMenuItem(item._id),
      "Menu item archived."
    );
  };

  const submitTable = async (event) => {
    event.preventDefault();

    const tableNumber = Number(tableForm.tableNumber);
    const capacity = Number(tableForm.capacity);

    if (
      !Number.isInteger(tableNumber) ||
      tableNumber < 1 ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 50
    ) {
      setError("Enter a valid table number and capacity from 1 to 50.");
      return;
    }

    await runAction(
      () =>
        createOwnerTable({
          tableNumber,
          capacity,
          location: tableForm.location.trim(),
        }),
      "Table created successfully."
    );

    setTableForm({ tableNumber: "", capacity: "2", location: "" });
  };

  const toggleTable = (table) =>
    runAction(
      () =>
        updateOwnerTable(table._id, {
          isActive: !table.isActive,
        }),
      `Table ${table.tableNumber} ${table.isActive ? "deactivated" : "activated"}.`
    );

  const submitSlot = async (event) => {
    event.preventDefault();

    const maxBookings = Number(slotForm.maxBookings);
    const sortOrder = Number(slotForm.sortOrder) || 0;

    if (
      !slotForm.name.trim() ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slotForm.startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slotForm.endTime) ||
      slotForm.startTime >= slotForm.endTime ||
      !Number.isInteger(maxBookings) ||
      maxBookings < 1
    ) {
      setError("Enter a valid name, time range and positive booking capacity.");
      return;
    }

    await runAction(
      () =>
        createOwnerTimeSlot({
          name: slotForm.name.trim(),
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          maxBookings,
          sortOrder,
        }),
      "Time slot created successfully."
    );

    setSlotForm({
      name: "",
      startTime: "12:00",
      endTime: "14:00",
      maxBookings: "10",
      sortOrder: "0",
    });
  };

  const toggleSlot = (slot) =>
    runAction(
      () =>
        updateOwnerTimeSlot(slot._id, {
          isActive: !slot.isActive,
        }),
      `Time slot ${slot.isActive ? "deactivated" : "activated"}.`
    );

  const updateBookingStatus = (booking, status) => {
    const actionLabel = status === "completed" ? "complete" : "cancel";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} booking ${booking.bookingNumber || ""}?`
      )
    ) {
      return;
    }

    runAction(
      () => api.patch(`/bookings/${booking._id}/status`, { status }),
      `Booking ${status === "completed" ? "completed" : "cancelled"}.`
    );
  };

  const today = dashboard?.today || {};
  const allTime = dashboard?.allTime || {};

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080f1e] px-4 text-slate-300">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4">Loading DineX dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f1e] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080f1e]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              DineX · Owner
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Uncle Mess Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user?.name || user?.fullName || "Owner"}
              </p>
              <p className="text-xs text-slate-400">
                {user?.email || "Owner account"}
              </p>
            </div>
            <button
              onClick={() => loadDashboard()}
              disabled={saving}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Logout
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-amber-400 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {saving && (
          <p className="text-sm text-amber-300">Saving changes…</p>
        )}

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Business overview</h2>
              <p className="mt-1 text-sm text-slate-400">
                Revenue and booking data reported by the backend.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Today's revenue"
                value={money(today.revenuePaise)}
                hint={`${today.paidBookings || 0} paid bookings`}
              />
              <Metric
                label="Today's estimated profit"
                value={money(today.estimatedProfitPaise)}
                hint="Revenue less estimated item costs"
              />
              <Metric
                label="All-time revenue"
                value={money(allTime.revenuePaise)}
              />
              <Metric
                label="All-time estimated profit"
                value={money(allTime.estimatedProfitPaise)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-[#111b2e] p-5">
                <h3 className="text-lg font-semibold">Today's bookings</h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(dashboard?.todayBookingStatuses || {}).length === 0 ? (
                    <EmptyState>No booking status data available.</EmptyState>
                  ) : (
                    Object.entries(dashboard?.todayBookingStatuses || {}).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                        >
                          <StatusBadge value={status} />
                          <span className="font-semibold">{count}</span>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#111b2e] p-5">
                <h3 className="text-lg font-semibold">Popular items</h3>
                <div className="mt-4 space-y-3">
                  {(dashboard?.popularItems || []).length === 0 ? (
                    <EmptyState>No paid item sales to display yet.</EmptyState>
                  ) : (
                    dashboard.popularItems.map((item, index) => (
                      <div
                        key={item._id || item.name || index}
                        className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {item.name || item._id || "Menu item"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.quantity || 0} sold
                          </p>
                        </div>
                        <p className="font-semibold text-amber-300">
                          {money(item.salesPaise ?? item.sales ?? 0)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-white/10 bg-[#111b2e] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Recent bookings</h3>
                <button
                  onClick={() => setActiveTab("bookings")}
                  className="text-sm font-medium text-amber-300 hover:text-amber-200"
                >
                  View all bookings →
                </button>
              </div>
              {(dashboard?.recentBookings || []).length === 0 ? (
                <EmptyState>No recent bookings yet.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">Booking</th>
                        <th className="pb-3 pr-4">Customer</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentBookings.map((booking) => (
                        <tr
                          key={booking._id}
                          className="border-t border-white/5"
                        >
                          <td className="py-3 pr-4">
                            {booking.bookingNumber || "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {booking.customer?.name ||
                              booking.customer?.fullName ||
                              booking.customer?.email ||
                              "Customer"}
                          </td>
                          <td className="py-3 pr-4">
                            {dateLabel(booking.bookingDateKey)}
                          </td>
                          <td className="py-3 pr-4">
                            {money(
                              booking.totalAmountPaise ??
                                booking.subtotalPaise ??
                                0
                            )}
                          </td>
                          <td className="py-3">
                            <StatusBadge value={booking.bookingStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        )}

        {activeTab === "bookings" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Manage bookings</h2>
              <p className="mt-1 text-sm text-slate-400">
                Review payments and update eligible booking statuses.
              </p>
            </div>

            {bookings.length === 0 ? (
              <EmptyState>No bookings found.</EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111b2e]">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="p-4">Booking</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date / Slot</th>
                      <th className="p-4">Guests</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Booking status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const canComplete =
                        booking.bookingStatus === "confirmed" &&
                        booking.paymentStatus === "paid";
                      const canCancel = [
                        "pending_payment",
                        "confirmed",
                      ].includes(booking.bookingStatus);

                      return (
                        <tr
                          key={booking._id}
                          className="border-t border-white/5 align-top"
                        >
                          <td className="p-4 font-medium">
                            {booking.bookingNumber || "—"}
                            <p className="mt-1 text-xs text-slate-500">
                              Table {booking.table?.tableNumber ?? "—"}
                            </p>
                          </td>
                          <td className="p-4">
                            {booking.customer?.name ||
                              booking.customer?.fullName ||
                              "Customer"}
                            <p className="mt-1 text-xs text-slate-400">
                              {booking.customer?.email || ""}
                            </p>
                          </td>
                          <td className="p-4">
                            {dateLabel(booking.bookingDateKey)}
                            <p className="mt-1 text-xs text-slate-400">
                              {booking.timeSlot?.name ||
                                booking.timeSlot?.startTime ||
                                "—"}
                            </p>
                          </td>
                          <td className="p-4">{booking.guests ?? "—"}</td>
                          <td className="p-4">
                            {money(
                              booking.totalAmountPaise ??
                                booking.subtotalPaise ??
                                0
                            )}
                          </td>
                          <td className="p-4">
                            <StatusBadge value={booking.paymentStatus} />
                          </td>
                          <td className="p-4">
                            <StatusBadge value={booking.bookingStatus} />
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col items-start gap-2">
                              {canComplete && (
                                <button
                                  disabled={saving}
                                  onClick={() =>
                                    updateBookingStatus(booking, "completed")
                                  }
                                  className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  disabled={saving}
                                  onClick={() =>
                                    updateBookingStatus(booking, "cancelled")
                                  }
                                  className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                              {!canComplete && !canCancel && (
                                <span className="text-xs text-slate-500">
                                  No actions
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "menu" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Menu management</h2>
              <p className="mt-1 text-sm text-slate-400">
                Prices are entered in rupees and saved in paise.
              </p>
            </div>

            <form
              onSubmit={submitMenuItem}
              className="grid gap-4 rounded-2xl border border-white/10 bg-[#111b2e] p-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              <h3 className="text-lg font-semibold sm:col-span-2 xl:col-span-3">
                Add menu item
              </h3>

              <input
                required
                value={menuForm.name}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, name: e.target.value })
                }
                placeholder="Item name"
                className="rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 outline-none focus:border-amber-400"
              />
              <input
                required
                value={menuForm.category}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, category: e.target.value })
                }
                placeholder="Category (e.g. Meals)"
                className="rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 outline-none focus:border-amber-400"
              />
              <input
                value={menuForm.description}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, description: e.target.value })
                }
                placeholder="Description (optional)"
                className="rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 outline-none focus:border-amber-400"
              />
              <label className="text-sm text-slate-400">
                Selling price (₹)
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={menuForm.sellingPrice}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, sellingPrice: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Cost price (₹)
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={menuForm.costPrice}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, costPrice: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Sort order
                <input
                  type="number"
                  step="1"
                  value={menuForm.sortOrder}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, sortOrder: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <button
                disabled={saving}
                className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50 sm:col-span-2 xl:col-span-3"
              >
                Add item
              </button>
            </form>

            {menuItems.length === 0 ? (
              <EmptyState>No menu items found. Add your first item above.</EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {menuItems.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-[#111b2e] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.category}
                        </p>
                      </div>
                      <StatusBadge
                        value={
                          !item.isActive
                            ? "inactive"
                            : item.isAvailable
                              ? "available"
                              : "unavailable"
                        }
                      />
                    </div>

                    {item.description && (
                      <p className="mt-3 text-sm text-slate-400">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xl font-bold text-amber-300">
                          {money(item.sellingPrice)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Cost: {money(item.costPrice)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        Sort: {item.sortOrder ?? 0}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {!item.isActive ? (
                        <button
                          disabled={saving}
                          onClick={() => restoreMenuItem(item)}
                          className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            disabled={saving}
                            onClick={() => toggleAvailability(item)}
                            className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                          >
                            {item.isAvailable ? "Make unavailable" : "Make available"}
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => archiveMenuItem(item)}
                            className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Archive
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "tables" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Table management</h2>
              <p className="mt-1 text-sm text-slate-400">
                Activate or deactivate tables without deleting booking history.
              </p>
            </div>

            <form
              onSubmit={submitTable}
              className="grid gap-4 rounded-2xl border border-white/10 bg-[#111b2e] p-5 sm:grid-cols-2 xl:grid-cols-4"
            >
              <h3 className="text-lg font-semibold sm:col-span-2 xl:col-span-4">
                Add table
              </h3>
              <label className="text-sm text-slate-400">
                Table number
                <input
                  required
                  min="1"
                  type="number"
                  step="1"
                  value={tableForm.tableNumber}
                  onChange={(e) =>
                    setTableForm({ ...tableForm, tableNumber: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Capacity
                <input
                  required
                  min="1"
                  max="50"
                  type="number"
                  step="1"
                  value={tableForm.capacity}
                  onChange={(e) =>
                    setTableForm({ ...tableForm, capacity: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Location
                <input
                  value={tableForm.location}
                  onChange={(e) =>
                    setTableForm({ ...tableForm, location: e.target.value })
                  }
                  placeholder="Indoor / outdoor"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <div className="flex items-end">
                <button
                  disabled={saving}
                  className="w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  Add table
                </button>
              </div>
            </form>

            {tables.length === 0 ? (
              <EmptyState>No tables found.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                  <article
                    key={table._id}
                    className="rounded-2xl border border-white/10 bg-[#111b2e] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">
                        Table {table.tableNumber}
                      </h3>
                      <StatusBadge value={table.isActive ? "active" : "inactive"} />
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Capacity: {table.capacity} guests
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {table.location || "Location not specified"}
                    </p>
                    <button
                      disabled={saving}
                      onClick={() => toggleTable(table)}
                      className="mt-5 w-full rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                    >
                      {table.isActive ? "Deactivate table" : "Activate table"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "slots" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Time-slot management</h2>
              <p className="mt-1 text-sm text-slate-400">
                Configure service times and maximum booking capacity.
              </p>
            </div>

            <form
              onSubmit={submitSlot}
              className="grid gap-4 rounded-2xl border border-white/10 bg-[#111b2e] p-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              <h3 className="text-lg font-semibold sm:col-span-2 xl:col-span-3">
                Add time slot
              </h3>
              <label className="text-sm text-slate-400">
                Slot name
                <input
                  required
                  value={slotForm.name}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, name: e.target.value })
                  }
                  placeholder="Lunch"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Start time
                <input
                  required
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, startTime: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                End time
                <input
                  required
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, endTime: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Maximum bookings
                <input
                  required
                  min="1"
                  type="number"
                  step="1"
                  value={slotForm.maxBookings}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, maxBookings: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="text-sm text-slate-400">
                Sort order
                <input
                  type="number"
                  step="1"
                  value={slotForm.sortOrder}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, sortOrder: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#080f1e] px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <div className="flex items-end">
                <button
                  disabled={saving}
                  className="w-full rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  Add time slot
                </button>
              </div>
            </form>

            {timeSlots.length === 0 ? (
              <EmptyState>No time slots found.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {timeSlots.map((slot) => (
                  <article
                    key={slot._id}
                    className="rounded-2xl border border-white/10 bg-[#111b2e] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold">{slot.name}</h3>
                      <StatusBadge value={slot.isActive ? "active" : "inactive"} />
                    </div>
                    <p className="mt-3 text-xl font-semibold text-amber-300">
                      {slot.startTime} – {slot.endTime}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Maximum bookings: {slot.maxBookings}
                    </p>
                    <button
                      disabled={saving}
                      onClick={() => toggleSlot(slot)}
                      className="mt-5 w-full rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                    >
                      {slot.isActive ? "Deactivate slot" : "Activate slot"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
        DineX · Uncle Mess · Owner management
      </footer>
    </div>
  );
}
