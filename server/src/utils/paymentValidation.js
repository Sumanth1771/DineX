
const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({}).strict(),
  params: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  query: z.object({}),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().regex(/^[a-fA-F0-9]{64}$/),
  }).strict(),
  params: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  query: z.object({}),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
