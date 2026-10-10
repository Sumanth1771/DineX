
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const SlotCapacity = require("../models/SlotCapacity");

const expirePendingBookings = async () => {
  const now = new Date();

  // Group expired holds by restaurant date and time slot.
  const groups = await Booking.aggregate([
    {
      $match: {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        paymentExpiresAt: { $lte: now },
      },
    },
    {
      $group: {
        _id: {
          bookingDateKey: "$bookingDateKey",
          timeSlot: "$timeSlot",
        },
      },
    },
  ]);

  for (const group of groups) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const { bookingDateKey, timeSlot } = group._id;

        const expired = await Booking.find({
          bookingDateKey,
          timeSlot,
          bookingStatus: "pending_payment",
          paymentStatus: "pending",
          paymentExpiresAt: { $lte: new Date() },
        })
          .select("_id")
          .session(session);

        if (expired.length === 0) return;

        const ids = expired.map((booking) => booking._id);

        const result = await Booking.updateMany(
          {
            _id: { $in: ids },
            bookingStatus: "pending_payment",
            paymentStatus: "pending",
          },
          {
            $set: {
              bookingStatus: "expired",
              expiredAt: new Date(),
            },
          },
          { session }
        );

        const count = result.modifiedCount;

        if (count > 0) {
          const capacity = await SlotCapacity.findOne({
            bookingDateKey,
            timeSlot,
          }).session(session);

          if (!capacity || capacity.reservedCount < count) {
            throw new Error(
              "Capacity mismatch: reconcile existing reservations before continuing"
            );
          }

          capacity.reservedCount -= count;
          await capacity.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }
  }

  return groups.length;
};

module.exports = { expirePendingBookings };
