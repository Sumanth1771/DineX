
const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const PaymentWebhookEvent = require("../models/PaymentWebhookEvent");

const paymentWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];

  if (!signature || !eventId || !Buffer.isBuffer(req.body)) {
    return res.status(400).send("Invalid webhook request");
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest();

  let supplied;

  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return res.status(400).send("Invalid signature");
  }

  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(expected, supplied)
  ) {
    return res.status(400).send("Invalid signature");
  }

  let event;

  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON");
  }

  // Acknowledge events we don't handle; don't mark them as paid.
  if (event.event !== "payment.captured") {
    return res.status(200).json({ received: true });
  }

  const payment = event.payload?.payment?.entity;

  if (
    !payment?.id ||
    !payment?.order_id ||
    !Number.isSafeInteger(payment.amount) ||
    payment.status !== "captured"
  ) {
    return res.status(400).send("Invalid payment payload");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await PaymentWebhookEvent.create(
        [{ eventId }],
        { session }
      );

      const booking = await Booking.findOne({
        razorpayOrderId: payment.order_id,
      }).session(session);

      if (!booking) {
        // Throwing aborts the event record too, so the provider can retry.
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (payment.amount !== booking.totalAmountPaise ||
          payment.currency !== "INR") {
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }

      if (
        booking.paymentStatus === "paid" &&
        booking.razorpayPaymentId === payment.id
      ) {
        return;
      }

      // Never resurrect an expired/cancelled booking automatically.
      // A captured payment for such a booking requires reconciliation/refund.
      if (
        booking.bookingStatus !== "pending_payment" ||
        booking.paymentStatus !== "pending" ||
        !booking.paymentExpiresAt ||
        booking.paymentExpiresAt <= new Date()
      ) {
        throw new Error("BOOKING_NOT_PAYABLE");
      }

      booking.paymentStatus = "paid";
      booking.bookingStatus = "confirmed";
      booking.razorpayPaymentId = payment.id;
      booking.paymentVerifiedAt = new Date();
      booking.paymentExpiresAt = null;

      await booking.save({ session });
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ received: true });
    }

    // Return a failure so the provider can retry and we can reconcile.
    console.error("Payment webhook processing failed:", error.message);
    return res.status(500).json({ received: false });
  } finally {
    await session.endSession();
  }
};

module.exports = { paymentWebhook };
