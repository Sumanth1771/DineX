
const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const createPaymentOrder = async (bookingId, customerId) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    customer: customerId,
    bookingStatus: "pending_payment",
    paymentStatus: "pending",
    paymentExpiresAt: { $gt: new Date() },
  });

  if (!booking) {
    throw new PaymentError("Booking is unavailable or has expired", 409);
  }

  if (!Number.isSafeInteger(booking.totalAmountPaise) ||
      booking.totalAmountPaise <= 0) {
    throw new PaymentError("Invalid booking amount", 400);
  }

  // Reuse an existing order if one has already been created.
  if (booking.razorpayOrderId) {
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: booking.razorpayOrderId,
      amount: booking.totalAmountPaise,
      currency: "INR",
      bookingNumber: booking.bookingNumber,
    };
  }

  const order = await razorpay.orders.create({
    amount: booking.totalAmountPaise,
    currency: "INR",
    receipt: booking.bookingNumber,
    notes: {
      bookingId: booking._id.toString(),
    },
  });

  const updated = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      customer: customerId,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      paymentExpiresAt: { $gt: new Date() },
      razorpayOrderId: null,
    },
    {
      $set: { razorpayOrderId: order.id },
    },
    { new: true }
  );

  if (!updated) {
    // A concurrent request may have created a different order.
    // Do not return an order that isn't associated with this booking.
    throw new PaymentError(
      "Payment setup changed. Please retry from your booking page.",
      409
    );
  }

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingNumber: booking.bookingNumber,
  };
};

const verifyPayment = async ({
  bookingId,
  customerId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    customer: customerId,
  });

  if (!booking) {
    throw new PaymentError("Booking not found", 404);
  }

  // Idempotent response if the same payment has already been processed.
  if (
    booking.paymentStatus === "paid" &&
    booking.razorpayPaymentId === razorpayPaymentId
  ) {
    return booking;
  }

  if (
    booking.bookingStatus !== "pending_payment" ||
    booking.paymentStatus !== "pending" ||
    !booking.paymentExpiresAt ||
    booking.paymentExpiresAt <= new Date()
  ) {
    throw new PaymentError("Booking has expired or is no longer payable", 409);
  }

  if (
    !booking.razorpayOrderId ||
    booking.razorpayOrderId !== razorpayOrderId
  ) {
    throw new PaymentError("Payment order does not match this booking", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${booking.razorpayOrderId}|${razorpayPaymentId}`)
    .digest();

  let suppliedSignature;

  try {
    suppliedSignature = Buffer.from(razorpaySignature, "hex");
  } catch {
    throw new PaymentError("Invalid payment signature", 400);
  }

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, suppliedSignature)
  ) {
    throw new PaymentError("Invalid payment signature", 400);
  }

  // Never trust the browser's success callback alone.
  const payment = await razorpay.payments.fetch(razorpayPaymentId);

  if (
    payment.order_id !== booking.razorpayOrderId ||
    payment.amount !== booking.totalAmountPaise ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  ) {
    throw new PaymentError(
      "Payment is not captured or does not match the booking",
      409
    );
  }

  // Use a conditional update so concurrent verification callbacks
  // cannot confirm an expired or already-changed booking.
  const updated = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      customer: customerId,
      razorpayOrderId: booking.razorpayOrderId,
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      paymentExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        paymentStatus: "paid",
        bookingStatus: "confirmed",
        razorpayPaymentId,
        paymentVerifiedAt: new Date(),
        paymentExpiresAt: null,
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new PaymentError(
      "Booking state changed while verifying payment. Contact the restaurant if money was deducted.",
      409
    );
  }

  return updated;
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  PaymentError,
};
