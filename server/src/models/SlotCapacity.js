
const mongoose = require("mongoose");

const slotCapacitySchema = new mongoose.Schema(
  {
    bookingDateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
    },
    maxBookings: {
      type: Number,
      required: true,
      min: 1,
    },
    reservedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

slotCapacitySchema.index(
  { bookingDateKey: 1, timeSlot: 1 },
  { unique: true }
);

module.exports = mongoose.model("SlotCapacity", slotCapacitySchema);
