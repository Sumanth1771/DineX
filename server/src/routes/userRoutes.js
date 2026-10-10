const express = require("express");

const {
  getMe,
} = require("../controllers/userController");

const {
  authenticate,
} = require("../middleware/auth");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  getMe
);

module.exports = router;