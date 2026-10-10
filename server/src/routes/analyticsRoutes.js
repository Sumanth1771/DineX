
const express = require("express");
const { getDashboardAnalytics } = require("../controllers/analyticsController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("owner"),
  getDashboardAnalytics
);

module.exports = router;
