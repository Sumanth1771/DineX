
const express = require("express");
const router = express.Router();

const {
  getTimeSlots,
  getAllTimeSlotsForOwner,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} = require("../controllers/timeSlotController");

const { authenticate, authorize } = require("../middleware/auth");

router.get("/", getTimeSlots);

router.get(
  "/manage/all",
  authenticate,
  authorize("owner"),
  getAllTimeSlotsForOwner
);

router.post(
  "/",
  authenticate,
  authorize("owner"),
  createTimeSlot
);

router.patch(
  "/:id",
  authenticate,
  authorize("owner"),
  updateTimeSlot
);

router.delete(
  "/:id",
  authenticate,
  authorize("owner"),
  deleteTimeSlot
);

module.exports = router;
