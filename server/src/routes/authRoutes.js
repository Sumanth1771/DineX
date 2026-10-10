const express = require("express");

const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/authController");

const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");

const {
  registerSchema,
  loginSchema,
} = require("../utils/validation");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);

module.exports = router;