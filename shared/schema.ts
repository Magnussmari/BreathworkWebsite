import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["client", "staff", "admin"] }).default("client").notNull(),
  isSuperuser: boolean("is_superuser").default(false).notNull(),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Class templates (9D Breathwork default + custom templates)
export const classTemplates = pgTable("class_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: integer("price").notNull(), // in ISK (whole numbers, zero-decimal currency)
  maxCapacity: integer("max_capacity").default(15).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // true for 9D Breathwork
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").references(() => users.id), // null for defaults, user id for custom
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scheduled classes (instances of templates)
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => classTemplates.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  location: varchar("location").notNull(),
  maxCapacity: integer("max_capacity").notNull(), // can override template default
  customPrice: integer("custom_price"), // optional custom price (ISK), overrides template price
  currentBookings: integer("current_bookings").default(0).notNull(),
  status: varchar("status", { enum: ["upcoming", "completed", "cancelled"] }).default("upcoming").notNull(),
  instructorNotes: text("instructor_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep services table for backward compatibility (will be migrated)
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxCapacity: integer("max_capacity").default(1),
  isActive: boolean("is_active").default(true),
  prerequisites: text("prerequisites"),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Instructors/staff members
export const instructors = pgTable("instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bio: text("bio"),
  specializations: text("specializations").array(),
  certifications: text("certifications").array(),
  experience: text("experience"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly availability templates for instructors
export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
  startTime: varchar("start_time").notNull(), // HH:mm format
  endTime: varchar("end_time").notNull(), // HH:mm format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Specific time slots for booking
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client registrations (simplified bookings for classes)
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "reserved"] }).default("reserved").notNull(),
  paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "refunded"] }).default("pending").notNull(),
  paymentAmount: integer("payment_amount").notNull(), // in ISK
  paymentMethod: varchar("payment_method", { enum: ["bank_transfer", "pay_on_arrival"] }).default("bank_transfer").notNull(),
  paymentReference: varchar("payment_reference"), // Booking number for bank transfer reference
  userConfirmedTransfer: boolean("user_confirmed_transfer").default(false).notNull(), // User checked "I have transferred"
  adminVerifiedPayment: boolean("admin_verified_payment").default(false).notNull(), // Admin verified payment in bank
  paymentDeadline: timestamp("payment_deadline"), // 24 hours from booking
  reservedUntil: timestamp("reserved_until"), // 5 minutes temporary hold
  attended: boolean("attended").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep old bookings table for backward compatibility
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id).notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "completed", "no_show"] }).default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  paymentStatus: varchar("payment_status", { enum: ["pending", "partial", "paid", "refunded"] }).default("pending"),
  notes: text("notes"),
  customFormData: jsonb("custom_form_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Waitlist for fully booked sessions
export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  position: integer("position").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blocked time periods (holidays, breaks, etc.)
export const blockedTimes = pgTable("blocked_times", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instructorId: varchar("instructor_id").references(() => instructors.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  reason: varchar("reason").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company payment information (for bank transfers)
export const companyPaymentInfo = pgTable("company_payment_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull().default("Breathwork EHF"),
  companyId: varchar("company_id").notNull().default(""), // Kennitala
  bankName: varchar("bank_name").notNull(),
  accountNumber: varchar("account_number").notNull(), // Format: 0123-26-004567
  iban: varchar("iban"),
  swiftBic: varchar("swift_bic"),
  instructions: text("instructions"), // Additional payment instructions in Icelandic
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gift vouchers and promotional codes
export const vouchers = pgTable("vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  type: varchar("type", { enum: ["gift_card", "discount", "free_session"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // Amount or percentage
  isPercentage: boolean("is_percentage").default(false),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  usageLimit: integer("usage_limit").default(1),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer invoices (for class registrations)
export const customerInvoices = pgTable("customer_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").unique().notNull(), // e.g., "INV-2025-001"
  registrationId: varchar("registration_id").references(() => registrations.id),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in ISK
  description: text("description"),
  status: varchar("status", { enum: ["draft", "sent", "paid", "cancelled"] }).default("draft").notNull(),
  pdfUrl: varchar("pdf_url"), // Supabase storage URL
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company expense invoices (for business expenses)
export const companyInvoices = pgTable("company_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull(),
  vendor: varchar("vendor").notNull(), // e.g., "Amazon Web Services"
  category: varchar("category").notNull(), // e.g., "Software", "Marketing", "Equipment"
  amount: integer("amount").notNull(), // in ISK
  currency: varchar("currency").default("ISK").notNull(),
  description: text("description"),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: varchar("status", { enum: ["pending", "paid", "overdue"] }).default("pending").notNull(),
  pdfUrl: varchar("pdf_url").notNull(), // Supabase storage URL
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  bookings: many(bookings),
  waitlistEntries: many(waitlist),
  instructor: one(instructors, {
    fields: [users.id],
    references: [instructors.userId],
  }),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, {
    fields: [instructors.userId],
    references: [users.id],
  }),
  availability: many(availability),
  timeSlots: many(timeSlots),
  bookings: many(bookings),
  blockedTimes: many(blockedTimes),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
  timeSlots: many(timeSlots),
  waitlistEntries: many(waitlist),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  instructor: one(instructors, {
    fields: [bookings.instructorId],
    references: [instructors.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
}));

export const timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
  instructor: one(instructors, {
    fields: [timeSlots.instructorId],
    references: [instructors.id],
  }),
  service: one(services, {
    fields: [timeSlots.serviceId],
    references: [services.id],
  }),
  bookings: many(bookings),
  waitlistEntries: many(waitlist),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  client: one(users, {
    fields: [waitlist.clientId],
    references: [users.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [waitlist.timeSlotId],
    references: [timeSlots.id],
  }),
  service: one(services, {
    fields: [waitlist.serviceId],
    references: [services.id],
  }),
}));

// New simplified schemas
export const insertClassTemplateSchema = createInsertSchema(classTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentBookings: true
}).extend({
  scheduledDate: z.string().or(z.date()).transform((val) =>
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  clientId: true,  // Comes from authenticated user session
  createdAt: true,
  updatedAt: true
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

// Old schemas (backward compatibility)
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInstructorSchema = createInsertSchema(instructors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAvailabilitySchema = createInsertSchema(availability).omit({ id: true, createdAt: true });
export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({ id: true, createdAt: true }).extend({
  startTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  endTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
});
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
export const insertBlockedTimeSchema = createInsertSchema(blockedTimes).omit({ id: true, createdAt: true });
export const insertVoucherSchema = createInsertSchema(vouchers).omit({ id: true, createdAt: true });
export const insertCompanyPaymentInfoSchema = createInsertSchema(companyPaymentInfo).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerInvoiceSchema = createInsertSchema(customerInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyInvoiceSchema = createInsertSchema(companyInvoices).omit({ id: true, createdAt: true, updatedAt: true });

// New simplified types
export type ClassTemplate = typeof classTemplates.$inferSelect;
export type InsertClassTemplate = z.infer<typeof insertClassTemplateSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

// User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Old types (backward compatibility)
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type BlockedTime = typeof blockedTimes.$inferSelect;
export type InsertBlockedTime = z.infer<typeof insertBlockedTimeSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type CompanyPaymentInfo = typeof companyPaymentInfo.$inferSelect;
export type InsertCompanyPaymentInfo = z.infer<typeof insertCompanyPaymentInfoSchema>;
export type CustomerInvoice = typeof customerInvoices.$inferSelect;
export type InsertCustomerInvoice = z.infer<typeof insertCustomerInvoiceSchema>;
export type CompanyInvoice = typeof companyInvoices.$inferSelect;
export type InsertCompanyInvoice = z.infer<typeof insertCompanyInvoiceSchema>;
