const { z } = require("zod");

const emptyParams = z.object({});
const emptyQuery = z.object({});

const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name is too long"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email is too long")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password is too long"),
  }),

  params: emptyParams,
  query: emptyQuery,
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email is too long")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(1, "Password is required")
      .max(128, "Password is too long"),
  }),

  params: emptyParams,
  query: emptyQuery,
});

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ID"
  );

const menuItemBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name is too long"),

  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .optional()
    .default(""),

  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(50, "Category is too long"),

  sellingPrice: z
    .number()
    .finite()
    .min(0, "Selling price cannot be negative"),

  costPrice: z
    .number()
    .finite()
    .min(0, "Cost price cannot be negative"),

  imageUrl: z
    .string()
    .trim()
    .max(2048, "Image URL is too long")
    .optional()
    .default(""),

  isAvailable: z
    .boolean()
    .optional()
    .default(true),

  isActive: z
    .boolean()
    .optional()
    .default(true),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

const createMenuItemSchema = z.object({
  body: menuItemBodySchema,
  params: emptyParams,
  query: emptyQuery,
});

const updateMenuItemSchema = z.object({
  body: menuItemBodySchema.partial(),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuery,
});

const getMenuItemSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuery,
});

const deleteMenuItemSchema = getMenuItemSchema;

const tableBodySchema = z.object({
  tableNumber: z
    .string()
    .trim()
    .min(1)
    .max(20),

  capacity: z
    .number()
    .int()
    .min(1)
    .max(50),

  location: z
    .string()
    .trim()
    .max(100)
    .optional()
    .default(""),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

const createTableSchema = z.object({
  body: tableBodySchema,
  params: emptyParams,
  query: emptyQuery,
});

const updateTableSchema = z.object({
  body: tableBodySchema.partial(),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuery,
});

const getTableSchema = getMenuItemSchema;

const deleteTableSchema = getMenuItemSchema;

const timePattern =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeSlotBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(50),

  startTime: z
    .string()
    .regex(timePattern, "Invalid start time"),

  endTime: z
    .string()
    .regex(timePattern, "Invalid end time"),

  maxBookings: z
    .number()
    .int()
    .min(1)
    .max(1000),

  isActive: z
    .boolean()
    .optional()
    .default(true),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

const createTimeSlotSchema = z.object({
  body: timeSlotBodySchema,
  params: emptyParams,
  query: emptyQuery,
});

const updateTimeSlotSchema = z.object({
  body: timeSlotBodySchema.partial(),
  params: z.object({
    id: objectIdSchema,
  }),
  query: emptyQuery,
});

module.exports = {
  registerSchema,
  loginSchema,

  createMenuItemSchema,
  updateMenuItemSchema,
  getMenuItemSchema,
  deleteMenuItemSchema,

  createTableSchema,
  updateTableSchema,
  getTableSchema,
  deleteTableSchema,
  createTimeSlotSchema,
  updateTimeSlotSchema,
};