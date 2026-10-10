
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const tomorrowDate = new Date(`${today}T00:00:00+05:30`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = tomorrowDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const paidStatuses = {
      paymentStatus: { $in: ["paid", "refunded"] },
      bookingStatus: { $in: ["confirmed", "completed", "cancelled"] },
    };

    const todayRange = {
      bookingDateKey: { $gte: today, $lt: tomorrow },
    };

    const [todayStats, allTimeStats, bookingCounts, popularItems, recentBookings] =
      await Promise.all([
        Booking.aggregate([
          {
            $match: {
              ...todayRange,
              paymentStatus: "paid",
              bookingStatus: { $in: ["confirmed", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              revenuePaise: { $sum: "$totalAmountPaise" },
              estimatedCostPaise: { $sum: "$totalCostPaise" },
              bookings: { $sum: 1 },
            },
          },
        ]),

        Booking.aggregate([
          {
            $match: {
              paymentStatus: "paid",
              bookingStatus: { $in: ["confirmed", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              revenuePaise: { $sum: "$totalAmountPaise" },
              estimatedCostPaise: { $sum: "$totalCostPaise" },
              bookings: { $sum: 1 },
            },
          },
        ]),

        Booking.aggregate([
          { $match: todayRange },
          { $group: { _id: "$bookingStatus", count: { $sum: 1 } } },
        ]),

        Booking.aggregate([
          {
            $match: {
              paymentStatus: "paid",
              bookingStatus: { $in: ["confirmed", "completed"] },
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.menuItem",
              name: { $first: "$items.name" },
              quantitySold: { $sum: "$items.quantity" },
              salesPaise: { $sum: "$items.totalPricePaise" },
            },
          },
          { $sort: { quantitySold: -1 } },
          { $limit: 5 },
        ]),

        Booking.find()
          .populate("customer", "name email")
          .populate("table", "tableNumber")
          .populate("timeSlot", "name startTime endTime")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    const todayResult = todayStats[0] || {
      revenuePaise: 0,
      estimatedCostPaise: 0,
      bookings: 0,
    };

    const allTimeResult = allTimeStats[0] || {
      revenuePaise: 0,
      estimatedCostPaise: 0,
      bookings: 0,
    };

    const statusCounts = Object.fromEntries(
      bookingCounts.map((item) => [item._id, item.count])
    );

    return res.status(200).json({
      success: true,
      data: {
        today: {
          revenuePaise: todayResult.revenuePaise,
          estimatedCostPaise: todayResult.estimatedCostPaise,
          estimatedProfitPaise:
            todayResult.revenuePaise - todayResult.estimatedCostPaise,
          paidBookings: todayResult.bookings,
        },
        allTime: {
          revenuePaise: allTimeResult.revenuePaise,
          estimatedCostPaise: allTimeResult.estimatedCostPaise,
          estimatedProfitPaise:
            allTimeResult.revenuePaise - allTimeResult.estimatedCostPaise,
          paidBookings: allTimeResult.bookings,
        },
        todayBookingStatuses: statusCounts,
        popularItems: popularItems.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          quantitySold: item.quantitySold,
          salesPaise: item.salesPaise,
        })),
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardAnalytics };
