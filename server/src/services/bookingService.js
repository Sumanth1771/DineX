
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const MenuItem = require("../models/MenuItem");
const DiningTable = require("../models/DiningTable");
const TimeSlot = require("../models/TimeSlot");
const SlotCapacity = require("../models/SlotCapacity");
const { generateBookingNumber } = require("../utils/booking");

const HOLD_MINUTES = 10;
const MAX_TRANSACTION_ATTEMPTS = 3;

class BookingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BookingError";
    this.statusCode = statusCode;
  }
}

const isValidDateKey = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey));

  if (!match) {
    return false;
  }

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
};

const getTodayInIndia = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const validateBookingDate = (dateKey) => {
  if (!isValidDateKey(dateKey)) {
    throw new BookingError(
      "Invalid booking date. Use DD/MM/YYYY."
    );
  }

  if (dateKey < getTodayInIndia()) {
    throw new BookingError("Past dates cannot be booked.");
  }
};

const expireOldHolds = async ({
  bookingDateKey,
  timeSlotId,
  session,
}) => {
  const now = new Date();

  const expiredBookings = await Booking.find({
    bookingDateKey,
    timeSlot: timeSlotId,
    bookingStatus: "pending_payment",
    paymentStatus: "pending",
    paymentExpiresAt: { $lte: now },
  })
    .select("_id")
    .session(session);

  if (expiredBookings.length === 0) {
    return;
  }

  const expiredIds = expiredBookings.map((booking) => booking._id);

  const updateResult = await Booking.updateMany(
    {
      _id: { $in: expiredIds },
      bookingStatus: "pending_payment",
      paymentStatus: "pending",
      paymentExpiresAt: { $lte: now },
    },
    {
      $set: {
        bookingStatus: "expired",
        expiredAt: now,
      },
    },
    { session }
  );

  const expiredCount = updateResult.modifiedCount;

  if (expiredCount > 0) {
    const counter = await SlotCapacity.findOne({
      bookingDateKey,
      timeSlot: timeSlotId,
    }).session(session);

    if (!counter || counter.reservedCount < expiredCount) {
      throw new Error(
        "Slot capacity counter is inconsistent; reconciliation is required."
      );
    }

    counter.reservedCount -= expiredCount;
    await counter.save({ session });
  }
};

const initializeSlotCapacity = async ({
  bookingDateKey,
  timeSlot,
  session,
}) => {
  try {
    await SlotCapacity.updateOne(
      {
        bookingDateKey,
        timeSlot: timeSlot._id,
      },
      {
        $setOnInsert: {
          bookingDateKey,
          timeSlot: timeSlot._id,
          maxBookings: timeSlot.maxBookings,
          reservedCount: 0,
        },
      },
      {
        upsert: true,
        session,
      }
    );
  } catch (error) {
    // A concurrent transaction may initialize the same counter.
    // Let transient transaction errors propagate for retry.
    if (error.code === 11000) {
      throw error;
    }

    throw error;
  }
};

const reserveSlotCapacity = async ({
  bookingDateKey,
  timeSlot,
  session,
}) => {
  const counter = await SlotCapacity.findOneAndUpdate(
    {
      bookingDateKey,
      timeSlot: timeSlot._id,
      reservedCount: { $lt: timeSlot.maxBookings },
    },
    {
      $inc: { reservedCount: 1 },
      $set: { maxBookings: timeSlot.maxBookings },
    },
    {
      new: true,
      session,
    }
  );

  if (!counter) {
    throw new BookingError(
      "This time slot is fully booked.",
      409
    );
  }

  return counter;
};

const createBookingAttempt = async ({ customerId, input }) => {
  const session = await mongoose.startSession();
  let createdBooking;

  try {
    await session.withTransaction(
      async () => {
        createdBooking = undefined;

        const {
          bookingDateKey,
          timeSlotId,
          guests,
          items,
          notes = "",
        } = input;

        validateBookingDate(bookingDateKey);

        const slot = await TimeSlot.findOne({
          _id: timeSlotId,
          isActive: true,
        }).session(session);

        if (!slot) {
          throw new BookingError(
            "The selected time slot is unavailable.",
            409
          );
        }

        const itemIds = items.map((item) => item.menuItemId);

        if (new Set(itemIds).size !== itemIds.length) {
          throw new BookingError(
            "Duplicate menu items are not allowed."
          );
        }

        const menuItems = await MenuItem.find({
          _id: { $in: itemIds },
          isActive: true,
          isAvailable: true,
        }).session(session);

        if (menuItems.length !== itemIds.length) {
          throw new BookingError(
            "One or more menu items are unavailable.",
            409
          );
        }

        const menuById = new Map(
          menuItems.map((item) => [
            item._id.toString(),
            item,
          ])
        );

        const bookingItems = items.map(
          ({ menuItemId, quantity }) => {
            const menuItem = menuById.get(menuItemId);

            if (
              !Number.isSafeInteger(menuItem.sellingPrice) ||
              !Number.isSafeInteger(menuItem.costPrice) ||
              menuItem.sellingPrice < 0 ||
              menuItem.costPrice < 0
            ) {
              throw new BookingError(
                "Menu prices must be valid integer paise values."
              );
            }

            const totalPricePaise =
              menuItem.sellingPrice * quantity;

            const totalCostPaise =
              menuItem.costPrice * quantity;

            if (
              !Number.isSafeInteger(totalPricePaise) ||
              !Number.isSafeInteger(totalCostPaise)
            ) {
              throw new BookingError(
                "The selected quantity is too large."
              );
            }

            return {
              menuItem: menuItem._id,
              name: menuItem.name,
              quantity,
              unitPricePaise: menuItem.sellingPrice,
              costPricePaise: menuItem.costPrice,
              totalPricePaise,
            };
          }
        );

        const subtotalPaise = bookingItems.reduce(
          (sum, item) => sum + item.totalPricePaise,
          0
        );

        const totalCostPaise = bookingItems.reduce(
          (sum, item) =>
            sum + item.costPricePaise * item.quantity,
          0
        );

        if (
          !Number.isSafeInteger(subtotalPaise) ||
          !Number.isSafeInteger(totalCostPaise) ||
          subtotalPaise <= 0
        ) {
          throw new BookingError(
            "Invalid booking total."
          );
        }

        // Expire stale holds before checking availability.
        await expireOldHolds({
          bookingDateKey,
          timeSlotId: slot._id,
          session,
        });

        // Ensure one counter document exists for this date and slot.
        await initializeSlotCapacity({
          bookingDateKey,
          timeSlot: slot,
          session,
        });

        // Atomically claim one unit of slot capacity.
        await reserveSlotCapacity({
          bookingDateKey,
          timeSlot: slot,
          session,
        });

        const now = new Date();

        const activeBookings = await Booking.find({
          bookingDateKey,
          timeSlot: slot._id,
          $or: [
            {
              bookingStatus: "confirmed",
            },
            {
              bookingStatus: "pending_payment",
              paymentStatus: "pending",
              paymentExpiresAt: { $gt: now },
            },
          ],
        })
          .select("table")
          .session(session);

        const occupiedTableIds = activeBookings.map(
          (booking) => booking.table
        );

        const tables = await DiningTable.find({
          isActive: true,
          capacity: { $gte: guests },
          _id: { $nin: occupiedTableIds },
        })
          .sort({ capacity: 1, tableNumber: 1 })
          .session(session);

        if (tables.length === 0) {
          throw new BookingError(
            "No suitable table is available for this slot.",
            409
          );
        }

        // Unique table/date/slot index provides the final collision guard.
        // Do not catch duplicate-key errors inside this transaction.
        const [booking] = await Booking.create(
          [
            {
              bookingNumber: generateBookingNumber(),
              customer: customerId,
              table: tables[0]._id,
              timeSlot: slot._id,
              bookingDateKey,
              guests,
              items: bookingItems,
              subtotalPaise,
              totalAmountPaise: subtotalPaise,
              totalCostPaise,
              paymentStatus: "pending",
              bookingStatus: "pending_payment",
              paymentExpiresAt: new Date(
                Date.now() + HOLD_MINUTES * 60 * 1000
              ),
              notes,
            },
          ],
          { session }
        );

        createdBooking = booking;
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    return createdBooking;
  } finally {
    await session.endSession();
  }
};

const createBooking = async ({ customerId, input }) => {
  let lastError;

  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await createBookingAttempt({
        customerId,
        input,
      });
    } catch (error) {
      lastError = error;

      if (error instanceof BookingError) {
        throw error;
      }

      const isRetryable =
        error.code === 11000 ||
        error.hasErrorLabel?.("TransientTransactionError") ||
        error.hasErrorLabel?.("UnknownTransactionCommitResult");

      if (!isRetryable || attempt === MAX_TRANSACTION_ATTEMPTS) {
        break;
      }
    }
  }

  if (lastError?.code === 11000) {
    throw new BookingError(
      "Availability changed. Please choose another slot.",
      409
    );
  }

  throw lastError;
};

module.exports = {
  createBooking,
  BookingError,
};
