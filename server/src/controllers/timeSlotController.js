
const TimeSlot = require("../models/TimeSlot");

const httpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (id) =>
  /^[a-f\d]{24}$/i.test(String(id));

const validTime = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validateTimeSlotInput = (body, partial = false) => {
  const allowedFields = [
    "name",
    "startTime",
    "endTime",
    "maxBookings",
    "sortOrder",
  ];

  const input = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      input[field] = body[field];
    }
  }

  if (!partial || Object.hasOwn(input, "name")) {
    if (typeof input.name !== "string" || !input.name.trim()) {
      throw httpError("Time slot name is required");
    }
    input.name = input.name.trim();
  }

  for (const field of ["startTime", "endTime"]) {
    if (!partial || Object.hasOwn(input, field)) {
      if (!validTime(input[field])) {
        throw httpError(`${field} must use HH:mm format`);
      }
    }
  }

  if (
    Object.hasOwn(input, "startTime") &&
    Object.hasOwn(input, "endTime") &&
    input.startTime >= input.endTime
  ) {
    throw httpError("End time must be later than start time");
  }

  if (!partial || Object.hasOwn(input, "maxBookings")) {
    if (
      !Number.isInteger(input.maxBookings) ||
      input.maxBookings < 1
    ) {
      throw httpError("maxBookings must be a positive integer");
    }
  }

  if (Object.hasOwn(input, "sortOrder")) {
    if (!Number.isInteger(input.sortOrder)) {
      throw httpError("sortOrder must be an integer");
    }
  }

  return input;
};

// Public: active time slots only.
const getTimeSlots = async (req, res, next) => {
  try {
    const timeSlots = await TimeSlot.find({ isActive: true })
      .sort({ sortOrder: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: { timeSlots },
    });
  } catch (error) {
    next(error);
  }
};

// Owner only: include inactive time slots.
const getAllTimeSlotsForOwner = async (req, res, next) => {
  try {
    const timeSlots = await TimeSlot.find({})
      .sort({ sortOrder: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: { timeSlots },
    });
  } catch (error) {
    next(error);
  }
};

const createTimeSlot = async (req, res, next) => {
  try {
    const input = validateTimeSlotInput(req.body);

    if (input.startTime >= input.endTime) {
      throw httpError("End time must be later than start time");
    }

    const timeSlot = await TimeSlot.create({
      ...input,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      data: { timeSlot },
    });
  } catch (error) {
    next(error);
  }
};

const updateTimeSlot = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid time slot ID", 400);
    }

    const input = validateTimeSlotInput(req.body, true);

    if (Object.hasOwn(req.body, "isActive")) {
      if (typeof req.body.isActive !== "boolean") {
        throw httpError("isActive must be true or false");
      }
      input.isActive = req.body.isActive;
    }

    const existing = await TimeSlot.findById(req.params.id);

    if (!existing) {
      throw httpError("Time slot not found", 404);
    }

    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;

    if (startTime >= endTime) {
      throw httpError("End time must be later than start time");
    }

    if (Object.keys(input).length === 0) {
      throw httpError("Provide at least one field to update");
    }

    const timeSlot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      { $set: input },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      data: { timeSlot },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTimeSlot = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid time slot ID", 400);
    }

    const timeSlot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );

    if (!timeSlot) {
      throw httpError("Time slot not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Time slot deactivated successfully",
      data: { timeSlot },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeSlots,
  getAllTimeSlotsForOwner,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
};
