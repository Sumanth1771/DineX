
const express = require("express");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelMyBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");

const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { bookingLimiter } = require("../middleware/rateLimiters");

const {
  createBookingSchema,
  bookingIdSchema,
  updateBookingStatusSchema,
} = require("../utils/bookingValidation");

const router = express.Router();

// All booking endpoints require authentication.
router.use(authenticate);

router.post(
  "/",
  authorize("customer"),
  bookingLimiter,
  validate(createBookingSchema),
  createBooking
);

router.get("/mine", authorize("customer"), getMyBookings);

router.patch(
  "/mine/:id/cancel",
  authorize("customer"),
  validate(bookingIdSchema),
  cancelMyBooking
);

router.get("/", authorize("owner"), getAllBookings);

router.patch(
  "/:id/status",
  authorize("owner"),
  validate(updateBookingStatusSchema),
  updateBookingStatus
);

module.exports = router;
