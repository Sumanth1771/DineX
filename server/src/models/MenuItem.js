const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Price stored in paise.
    // Example: ₹60 = 6000 paise
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Selling price must be in paise",
      },
    },

    // Cost stored in paise.
    // Example: ₹30 = 3000 paise
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Cost price must be in paise",
      },
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Helps quickly fetch available menu items by category.
menuItemSchema.index({
  category: 1,
  isActive: 1,
  isAvailable: 1,
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;