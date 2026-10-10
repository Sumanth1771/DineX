
const MenuItem = require("../models/MenuItem");

const httpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (id) =>
  /^[a-f\d]{24}$/i.test(String(id));

const validateMenuInput = (body, partial = false) => {
  const allowedFields = [
    "name",
    "description",
    "category",
    "sellingPrice",
    "costPrice",
    "isAvailable",
    "isActive",
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
      throw httpError("Menu item name is required");
    }
    input.name = input.name.trim();
  }

  if (!partial || Object.hasOwn(input, "category")) {
    if (
      typeof input.category !== "string" ||
      !input.category.trim()
    ) {
      throw httpError("Menu item category is required");
    }
    input.category = input.category.trim();
  }

  if (
    Object.hasOwn(input, "description") &&
    typeof input.description !== "string"
  ) {
    throw httpError("Description must be text");
  }

  for (const field of ["sellingPrice", "costPrice"]) {
    if (!partial || Object.hasOwn(input, field)) {
      if (
        !Number.isSafeInteger(input[field]) ||
        input[field] < 0
      ) {
        throw httpError(
          `${field} must be a non-negative integer in paise`
        );
      }
    }
  }

  for (const field of ["isAvailable", "isActive"]) {
    if (
      Object.hasOwn(input, field) &&
      typeof input[field] !== "boolean"
    ) {
      throw httpError(`${field} must be true or false`);
    }
  }

  if (Object.hasOwn(input, "sortOrder")) {
    if (!Number.isInteger(input.sortOrder)) {
      throw httpError("sortOrder must be an integer");
    }
  }

  return input;
};

// Public menu: only active and available items.
const getMenuItems = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({
      isActive: true,
      isAvailable: true,
    }).sort({ category: 1, sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: { menuItems },
    });
  } catch (error) {
    next(error);
  }
};

// Owner management: include archived and unavailable items.
const getAllMenuItemsForOwner = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({})
      .sort({ category: 1, sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: { menuItems },
    });
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const input = validateMenuInput(req.body);

    const menuItem = await MenuItem.create({
      ...input,
      isActive: true,
      isAvailable: input.isAvailable ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid menu item ID");
    }

    const input = validateMenuInput(req.body, true);

    if (Object.keys(input).length === 0) {
      throw httpError("Provide at least one field to update");
    }

    // Restoring an item makes it active and available.
    if (input.isActive === true && !Object.hasOwn(input, "isAvailable")) {
      input.isAvailable = true;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      throw httpError("Menu item not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      throw httpError("Invalid menu item ID");
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, isAvailable: false } },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      throw httpError("Menu item not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Menu item archived successfully",
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  getAllMenuItemsForOwner,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
