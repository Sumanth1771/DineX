
const express = require("express");
const router = express.Router();

const {
  getMenuItems,
  getAllMenuItemsForOwner,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

const { authenticate, authorize } = require("../middleware/auth");

// IMPORTANT: keep /manage/all before any /:id route.
router.get("/", getMenuItems);

router.get(
  "/manage/all",
  authenticate,
  authorize("owner"),
  getAllMenuItemsForOwner
);

router.post(
  "/",
  authenticate,
  authorize("owner"),
  createMenuItem
);

router.patch(
  "/:id",
  authenticate,
  authorize("owner"),
  updateMenuItem
);

router.delete(
  "/:id",
  authenticate,
  authorize("owner"),
  deleteMenuItem
);

module.exports = router;
