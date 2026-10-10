
const SlotCapacity = require("../models/SlotCapacity");

const reserveSlotCapacity = async (bookingDateKey, timeSlot) => {
  const filter = {
    bookingDateKey,
    timeSlot: timeSlot._id,
  };

  // Initialize the counter once. Concurrent initializations are safe.
  try {
    await SlotCapacity.updateOne(
      filter,
      {
        $setOnInsert: {
          ...filter,
          maxBookings: timeSlot.maxBookings,
          reservedCount: 0,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  // Atomically claim one available slot.
  return SlotCapacity.findOneAndUpdate(
    {
      ...filter,
      reservedCount: { $lt: timeSlot.maxBookings },
    },
    {
      $inc: { reservedCount: 1 },
      $set: { maxBookings: timeSlot.maxBookings },
    },
    { new: true }
  );
};

const releaseSlotCapacity = async (bookingDateKey, timeSlotId) => {
  return SlotCapacity.findOneAndUpdate(
    {
      bookingDateKey,
      timeSlot: timeSlotId,
      reservedCount: { $gt: 0 },
    },
    { $inc: { reservedCount: -1 } },
    { new: true }
  );
};

module.exports = {
  reserveSlotCapacity,
  releaseSlotCapacity,
};
