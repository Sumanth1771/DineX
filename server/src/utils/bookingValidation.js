
const { z } = require("zod");

const createBookingSchema = z.object({
  body: z.object({
    bookingDateKey: z.string().transform((value, context) => {
      const trimmed = value.trim();
      const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
      const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

      if (isoMatch) return trimmed;

      if (displayMatch) {
        const [, day, month, year] = displayMatch;
        return `${year}-${month}-${day}`;
      }

      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date must use DD/MM/YYYY",
      });
      return z.NEVER;
    }),
    timeSlotId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    guests: z.number().int().min(1).max(50),
    items: z.array(
      z.object({
        menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        quantity: z.number().int().min(1).max(100),
      }).strict()
    ).min(1).max(30),
    notes: z.string().trim().max(500).optional().default(""),
  }).strict(),
  params: z.object({}),
  query: z.object({}),
});

const bookingIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  query: z.object({}),
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    bookingStatus: z.enum(["completed", "cancelled"]),
  }).strict(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  query: z.object({}),
});

module.exports = {
  createBookingSchema,
  bookingIdSchema,
  updateBookingStatusSchema,
};
