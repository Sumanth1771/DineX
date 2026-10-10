
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const menuRoutes = require("./routes/menuRoutes");
const tableRoutes = require("./routes/tableRoutes");
const timeSlotRoutes = require("./routes/timeSlotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { paymentWebhook } = require("./controllers/paymentWebhookController");

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    ...(process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
        ]
      : []),
  ].filter(Boolean)
);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Requests from curl and server-to-server clients may have no Origin.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Webhook must receive the raw request body for signature verification.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "100kb" }),
  paymentWebhook
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/time-slots", timeSlotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DineX API is running",
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Frontend origin is not allowed",
    });
  }

  console.error(err);

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with these details already exists",
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message:
      err.statusCode && err.statusCode < 500
        ? err.message
        : "Internal server error",
  });
});

module.exports = app;
