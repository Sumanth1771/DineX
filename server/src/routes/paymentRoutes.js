
const express = require("express");

const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { bookingLimiter } = require("../middleware/rateLimiters");

const {
  createOrder,
  verifyCheckoutPayment,
} = require("../controllers/paymentController");

const {
  createOrderSchema,
  verifyPaymentSchema,
} = require("../utils/paymentValidation");

const router = express.Router();

router.use(authenticate, authorize("customer"));

router.post(
  "/:bookingId/order",
  bookingLimiter,
  validate(createOrderSchema),
  createOrder
);

router.post(
  "/:bookingId/verify",
  bookingLimiter,
  validate(verifyPaymentSchema),
  verifyCheckoutPayment
);

module.exports = router;
