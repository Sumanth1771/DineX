const mongoose = require("mongoose");

const diningTableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DiningTable = mongoose.model(
  "DiningTable",
  diningTableSchema
);

module.exports = DiningTable;