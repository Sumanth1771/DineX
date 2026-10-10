require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

const requiredEnv = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "CLIENT_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
];
const { startBookingExpiryWorker } = require("./services/bookingExpiryWorker");
const validateEnvironment = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_ACCESS_SECRET.length < 32
  ) {
    console.error(
      "JWT_ACCESS_SECRET must be at least 32 characters in production.",
    );
    process.exit(1);
  }

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    console.error("PORT must be a valid port number.");
    process.exit(1);
  }
};

const startServer = async () => {
  validateEnvironment();

  await connectDatabase();
  startBookingExpiryWorker();
  const server = app.listen(PORT, () => {
    console.log(`DineX API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down DineX...`);

    server.close(() => {
      const mongoose = require("mongoose");

      mongoose
        .disconnect()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("Database shutdown failed:", error.message);
          process.exit(1);
        });
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("DineX startup failed:", error.message);
  process.exit(1);
});
