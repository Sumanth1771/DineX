const mongoose = require("mongoose");

const bookingItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },

    costPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiningTable",
      required: true,
      index: true,
    },

    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
      index: true,
    },

    /*
     * Restaurant-local date.
     * Example:
     * 2026-10-05
     */
    bookingDateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },

    items: {
      type: [bookingItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one food item is required",
      },
    },

    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmountPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCostPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    bookingStatus: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending_payment",
      index: true,
    },

    paymentExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    expiredAt: {
      type: Date,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * A table can only have one active booking
 * for a particular date + time slot.
 *
 * Pending-payment and confirmed bookings both
 * reserve the table.
 */
bookingSchema.index(
  {
    table: 1,
    bookingDateKey: 1,
    timeSlot: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      bookingStatus: {
        $in: ["pending_payment", "confirmed"],
      },
    },
  },
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
