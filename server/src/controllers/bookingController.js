
const mongoose = require("mongoose");

const Booking = require("../models/Booking");

const {
  createBooking: createBookingService,
  BookingError,
} = require("../services/bookingService");

const {
  cancelCustomerBooking,
  BookingLifecycleError,
} = require("../services/bookingLifecycleService");

// POST /api/bookings
// Create a temporary booking hold for an authenticated customer.
const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingService({
      customerId: req.user.userId,
      input: req.validated.body,
    });

    return res.status(201).json({
      success: true,
      message:
        "Booking hold created. Complete payment before it expires.",
      data: { booking },
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

// GET /api/bookings/mine
// A customer can only view their own bookings.
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      customer: req.user.userId,
    })
      .populate("table", "tableNumber capacity location")
      .populate("timeSlot", "name startTime endTime")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/bookings
// Owner can view recent bookings across all customers.
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email")
      .populate("table", "tableNumber capacity location")
      .populate("timeSlot", "name startTime endTime")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/bookings/mine/:id/cancel
// Cancel an eligible unpaid customer booking and release capacity.
const cancelMyBooking = async (req, res, next) => {
  try {
    const booking = await cancelCustomerBooking(
      req.validated.params.id,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error) {
    if (error instanceof BookingLifecycleError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

// PATCH /api/bookings/:id/status
// Owner can complete or cancel eligible bookings.
const updateBookingStatus = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.validated.params;
    const { bookingStatus } = req.validated.body;

    let updatedBooking;

    await session.withTransaction(async () => {
      const booking = await Booking.findById(id).session(session);

      if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        bookingStatus === "completed" &&
        (
          booking.bookingStatus !== "confirmed" ||
          booking.paymentStatus !== "paid"
        )
      ) {
        const error = new Error(
          "Only paid, confirmed bookings can be completed"
        );
        error.statusCode = 409;
        throw error;
      }

      if (bookingStatus === "cancelled") {
        if (booking.paymentStatus === "paid") {
          const error = new Error(
            "Paid bookings require the refund process"
          );
          error.statusCode = 409;
          throw error;
        }

        if (
          !["pending_payment", "confirmed"].includes(
            booking.bookingStatus
          )
        ) {
          const error = new Error(
            "This booking cannot be cancelled"
          );
          error.statusCode = 409;
          throw error;
        }

        const SlotCapacity = require("../models/SlotCapacity");

        const capacity = await SlotCapacity.findOne({
          bookingDateKey: booking.bookingDateKey,
          timeSlot: booking.timeSlot,
        }).session(session);

        if (capacity) {
          if (capacity.reservedCount <= 0) {
            throw new Error(
              "Slot capacity counter is inconsistent"
            );
          }

          capacity.reservedCount -= 1;
          await capacity.save({ session });
        }

        booking.cancelledAt = new Date();
      }

      booking.bookingStatus = bookingStatus;

      if (bookingStatus === "completed") {
        booking.completedAt = new Date();
      }

      await booking.save({ session });

      updatedBooking = booking;
    });

    return res.status(200).json({
      success: true,
      message: `Booking ${bookingStatus} successfully`,
      data: { booking: updatedBooking },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelMyBooking,
  updateBookingStatus,
};
