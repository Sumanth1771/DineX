
const mongoose = require("mongoose");

const paymentWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PaymentWebhookEvent",
  paymentWebhookEventSchema
);
