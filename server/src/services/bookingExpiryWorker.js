
const { expirePendingBookings } = require("./bookingExpiryService");

let running = false;

const runExpiry = async () => {
  if (running) return;

  running = true;

  try {
    await expirePendingBookings();
  } catch (error) {
    console.error("Booking expiry worker failed:", error.message);
  } finally {
    running = false;
  }
};

const startBookingExpiryWorker = () => {
  // Process overdue holds on startup and then once per minute.
  void runExpiry();

  const timer = setInterval(() => {
    void runExpiry();
  }, 60 * 1000);

  timer.unref();

  return () => clearInterval(timer);
};

module.exports = { startBookingExpiryWorker };
