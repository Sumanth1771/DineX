require("dotenv").config();

const mongoose = require("mongoose");

const MenuItem = require("../src/models/MenuItem");
const TimeSlot = require("../src/models/TimeSlot");

const menuItems = [
  {
    name: "Meals",
    description: "A filling homestyle meal with rice, curry, dal, vegetables and sides.",
    category: "Meals",
    sellingPrice: 4000,
    costPrice: 2400,
    sortOrder: 1,
  },
  {
    name: "Chapati Meals",
    description: "Soft chapatis served with a wholesome selection of Uncle Mess sides.",
    category: "Meals",
    sellingPrice: 5000,
    costPrice: 3000,
    sortOrder: 2,
  },
  {
    name: "Parotha Meals",
    description: "Flaky parothas paired with comforting curry and fresh sides.",
    category: "Meals",
    sellingPrice: 6000,
    costPrice: 3600,
    sortOrder: 3,
  },
  {
    name: "Roti Meals",
    description: "Fresh rotis with a balanced homestyle meal.",
    category: "Meals",
    sellingPrice: 6000,
    costPrice: 3600,
    sortOrder: 4,
  },
  {
    name: "Mudde Meals",
    description: "Traditional ragi mudde served with a delicious, hearty curry.",
    category: "Meals",
    sellingPrice: 8000,
    costPrice: 4800,
    sortOrder: 5,
  },
  {
    name: "Egg Burji Meals",
    description: "Egg burji served with a satisfying homestyle meal.",
    category: "Meals",
    sellingPrice: 8000,
    costPrice: 4800,
    sortOrder: 6,
  },
];

const timeSlots = [
  {
    name: "Lunch 1",
    startTime: "11:30",
    endTime: "12:15",
    maxBookings: 20,
    sortOrder: 1,
  },
  {
    name: "Lunch 2",
    startTime: "12:15",
    endTime: "13:00",
    maxBookings: 20,
    sortOrder: 2,
  },
  {
    name: "Lunch 3",
    startTime: "13:00",
    endTime: "13:45",
    maxBookings: 20,
    sortOrder: 3,
  },
  {
    name: "Lunch 4",
    startTime: "13:45",
    endTime: "14:30",
    maxBookings: 20,
    sortOrder: 4,
  },
  {
    name: "Lunch 5",
    startTime: "14:30",
    endTime: "15:15",
    maxBookings: 20,
    sortOrder: 5,
  },
  {
    name: "Lunch 6",
    startTime: "15:15",
    endTime: "16:00",
    maxBookings: 20,
    sortOrder: 6,
  },
  {
    name: "Dinner",
    startTime: "19:00",
    endTime: "22:00",
    maxBookings: 20,
    sortOrder: 7,
  },
];

const setupCatalog = async () => {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  await MenuItem.updateMany(
    {},
    { $set: { isActive: false, isAvailable: false } }
  );

  await TimeSlot.updateMany({}, { $set: { isActive: false } });

  for (const item of menuItems) {
    await MenuItem.findOneAndUpdate(
      { name: item.name },
      {
        $set: {
          ...item,
          isActive: true,
          isAvailable: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (const slot of timeSlots) {
    await TimeSlot.findOneAndUpdate(
      { name: slot.name },
      { $set: { ...slot, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Catalog ready: ${menuItems.length} meals and ${timeSlots.length} time slots.`);
};

setupCatalog()
  .catch((error) => {
    console.error("Catalog setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
