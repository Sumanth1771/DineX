
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const SlotCapacity = require("../models/SlotCapacity");

class BookingLifecycleError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const cancelCustomerBooking = async (bookingId, customerId) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({
        _id: bookingId,
        customer: customerId,
      }).session(session);

      if (!booking) {
        throw new BookingLifecycleError("Booking not found", 404);
      }

      if (
        !["pending_payment", "confirmed"].includes(booking.bookingStatus)
      ) {
        throw new BookingLifecycleError(
          "This booking cannot be cancelled",
          409
        );
      }

      if (booking.paymentStatus === "paid") {
        throw new BookingLifecycleError(
          "Paid bookings require the refund process",
          409
        );
      }

      const now = new Date();

      booking.bookingStatus = "cancelled";
      booking.cancelledAt = now;
      await booking.save({ session });

      const capacity = await SlotCapacity.findOne({
        bookingDateKey: booking.bookingDateKey,
        timeSlot: booking.timeSlot,
      }).session(session);

      if (capacity) {
        if (capacity.reservedCount <= 0) {
          throw new Error("Slot capacity counter is inconsistent");
        }

        capacity.reservedCount -= 1;
        await capacity.save({ session });
      }

      result = booking;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  cancelCustomerBooking,
  BookingLifecycleError,
};
