
const DiningTable = require("../models/DiningTable");

const httpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (id) =>
  /^[a-f\d]{24}$/i.test(String(id));

const validateTableInput = (body, partial = false) => {
  const allowedFields = ["tableNumber", "capacity", "location"];
  const input = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      input[field] = body[field];
    }
  }

  if (!partial || Object.hasOwn(input, "tableNumber")) {
    if (
      !Number.isInteger(input.tableNumber) ||
      input.tableNumber < 1
    ) {
      throw httpError("tableNumber must be a positive integer");
    }
  }

  if (!partial || Object.hasOwn(input, "capacity")) {
    if (
      !Number.isInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 50
    ) {
      throw httpError("Table capacity must be between 1 and 50");
    }
  }

  if (
    Object.hasOwn(input, "location") &&
    typeof input.location !== "string"
  ) {
    throw httpError("Table location must be text");
  }

  if (Object.hasOwn(input, "location")) {
    input.location = input.location.trim();
  }

  return input;
};

// Public: active tables only.
const getTables = async (req, res, next) => {
  try {
    const tables = await DiningTable.find({ isActive: true })
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    next(error);
  }
};

// Owner only: include inactive tables.
const getAllTablesForOwner = async (req, res, next) => {
  try {
    const tables = await DiningTable.find({})
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    next(error);
  }
};

const createTable = async (req, res, next) => {
  try {
    const input = validateTableInput(req.body);

    const table = await DiningTable.create({
      ...input,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid table ID", 400);
    }

    const input = validateTableInput(req.body, true);

    // isActive is owner-controlled, but never accept arbitrary fields.
    if (Object.hasOwn(req.body, "isActive")) {
      if (typeof req.body.isActive !== "boolean") {
        throw httpError("isActive must be true or false");
      }
      input.isActive = req.body.isActive;
    }

    if (Object.keys(input).length === 0) {
      throw httpError("Provide at least one field to update");
    }

    const table = await DiningTable.findByIdAndUpdate(
      req.params.id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!table) {
      throw httpError("Table not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid table ID", 400);
    }

    const table = await DiningTable.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );

    if (!table) {
      throw httpError("Table not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Table deactivated successfully",
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  getAllTablesForOwner,
  createTable,
  updateTable,
  deleteTable,
};
