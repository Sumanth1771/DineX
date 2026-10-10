
const {
  createPaymentOrder,
  verifyPayment,
  PaymentError,
} = require("../services/paymentService");

const createOrder = async (req, res, next) => {
  try {
    const result = await createPaymentOrder(
      req.validated.params.bookingId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

const verifyCheckoutPayment = async (req, res, next) => {
  try {
    const booking = await verifyPayment({
      bookingId: req.validated.params.bookingId,
      customerId: req.user.userId,
      razorpayOrderId: req.validated.body.razorpay_order_id,
      razorpayPaymentId: req.validated.body.razorpay_payment_id,
      razorpaySignature: req.validated.body.razorpay_signature,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed",
      data: { booking },
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

module.exports = { createOrder, verifyCheckoutPayment };
