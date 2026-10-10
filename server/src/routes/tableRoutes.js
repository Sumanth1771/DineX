
const express = require("express");
const router = express.Router();

const {
  getTables,
  getAllTablesForOwner,
  createTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");

const { authenticate, authorize } = require("../middleware/auth");

router.get("/", getTables);

router.get(
  "/manage/all",
  authenticate,
  authorize("owner"),
  getAllTablesForOwner
);

router.post(
  "/",
  authenticate,
  authorize("owner"),
  createTable
);

router.patch(
  "/:id",
  authenticate,
  authorize("owner"),
  updateTable
);

router.delete(
  "/:id",
  authenticate,
  authorize("owner"),
  deleteTable
);

module.exports = router;
