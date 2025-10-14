var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  availability: () => availability,
  blockedTimes: () => blockedTimes,
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  classTemplates: () => classTemplates,
  classes: () => classes,
  companyInvoices: () => companyInvoices,
  companyPaymentInfo: () => companyPaymentInfo,
  customerInvoices: () => customerInvoices,
  insertAvailabilitySchema: () => insertAvailabilitySchema,
  insertBlockedTimeSchema: () => insertBlockedTimeSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertClassSchema: () => insertClassSchema,
  insertClassTemplateSchema: () => insertClassTemplateSchema,
  insertCompanyInvoiceSchema: () => insertCompanyInvoiceSchema,
  insertCompanyPaymentInfoSchema: () => insertCompanyPaymentInfoSchema,
  insertCustomerInvoiceSchema: () => insertCustomerInvoiceSchema,
  insertInstructorSchema: () => insertInstructorSchema,
  insertRegistrationSchema: () => insertRegistrationSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertTimeSlotSchema: () => insertTimeSlotSchema,
  insertUserSchema: () => insertUserSchema,
  insertVoucherSchema: () => insertVoucherSchema,
  insertWaitlistSchema: () => insertWaitlistSchema,
  instructors: () => instructors,
  instructorsRelations: () => instructorsRelations,
  loginSchema: () => loginSchema,
  registerSchema: () => registerSchema,
  registrations: () => registrations,
  services: () => services,
  servicesRelations: () => servicesRelations,
  timeSlots: () => timeSlots,
  timeSlotsRelations: () => timeSlotsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  vouchers: () => vouchers,
  waitlist: () => waitlist,
  waitlistRelations: () => waitlistRelations
});
import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users, classTemplates, classes, services, instructors, availability, timeSlots, registrations, bookings, waitlist, blockedTimes, companyPaymentInfo, vouchers, customerInvoices, companyInvoices, usersRelations, instructorsRelations, servicesRelations, bookingsRelations, timeSlotsRelations, waitlistRelations, insertClassTemplateSchema, insertClassSchema, insertRegistrationSchema, insertUserSchema, loginSchema, registerSchema, insertServiceSchema, insertInstructorSchema, insertBookingSchema, insertAvailabilitySchema, insertTimeSlotSchema, insertWaitlistSchema, insertBlockedTimeSchema, insertVoucherSchema, insertCompanyPaymentInfoSchema, insertCustomerInvoiceSchema, insertCompanyInvoiceSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    classTemplates = pgTable("class_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description").notNull(),
      duration: integer("duration").notNull(),
      // in minutes
      price: integer("price").notNull(),
      // in ISK (whole numbers, zero-decimal currency)
      maxCapacity: integer("max_capacity").default(15).notNull(),
      isDefault: boolean("is_default").default(false).notNull(),
      // true for 9D Breathwork
      isActive: boolean("is_active").default(true).notNull(),
      createdBy: varchar("created_by").references(() => users.id),
      // null for defaults, user id for custom
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    classes = pgTable("classes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      templateId: varchar("template_id").references(() => classTemplates.id).notNull(),
      scheduledDate: timestamp("scheduled_date").notNull(),
      location: varchar("location").notNull(),
      maxCapacity: integer("max_capacity").notNull(),
      // can override template default
      customPrice: integer("custom_price"),
      // optional custom price (ISK), overrides template price
      currentBookings: integer("current_bookings").default(0).notNull(),
      status: varchar("status", { enum: ["upcoming", "completed", "cancelled"] }).default("upcoming").notNull(),
      instructorNotes: text("instructor_notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    services = pgTable("services", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    instructors = pgTable("instructors", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      bio: text("bio"),
      specializations: text("specializations").array(),
      certifications: text("certifications").array(),
      experience: text("experience"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    availability = pgTable("availability", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
      dayOfWeek: integer("day_of_week").notNull(),
      // 0 = Sunday, 6 = Saturday
      startTime: varchar("start_time").notNull(),
      // HH:mm format
      endTime: varchar("end_time").notNull(),
      // HH:mm format
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    timeSlots = pgTable("time_slots", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      instructorId: varchar("instructor_id").references(() => instructors.id).notNull(),
      serviceId: varchar("service_id").references(() => services.id).notNull(),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time").notNull(),
      isAvailable: boolean("is_available").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    registrations = pgTable("registrations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      classId: varchar("class_id").references(() => classes.id).notNull(),
      clientId: varchar("client_id").references(() => users.id).notNull(),
      status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "reserved"] }).default("reserved").notNull(),
      paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "refunded"] }).default("pending").notNull(),
      paymentAmount: integer("payment_amount").notNull(),
      // in ISK
      paymentMethod: varchar("payment_method", { enum: ["bank_transfer", "pay_on_arrival"] }).default("bank_transfer").notNull(),
      paymentReference: varchar("payment_reference"),
      // Booking number for bank transfer reference
      userConfirmedTransfer: boolean("user_confirmed_transfer").default(false).notNull(),
      // User checked "I have transferred"
      adminVerifiedPayment: boolean("admin_verified_payment").default(false).notNull(),
      // Admin verified payment in bank
      paymentDeadline: timestamp("payment_deadline"),
      // 24 hours from booking
      reservedUntil: timestamp("reserved_until"),
      // 5 minutes temporary hold
      attended: boolean("attended").default(false).notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    bookings = pgTable("bookings", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    waitlist = pgTable("waitlist", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      clientId: varchar("client_id").references(() => users.id).notNull(),
      timeSlotId: varchar("time_slot_id").references(() => timeSlots.id).notNull(),
      serviceId: varchar("service_id").references(() => services.id).notNull(),
      position: integer("position").notNull(),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    blockedTimes = pgTable("blocked_times", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      instructorId: varchar("instructor_id").references(() => instructors.id),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time").notNull(),
      reason: varchar("reason").notNull(),
      isRecurring: boolean("is_recurring").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    companyPaymentInfo = pgTable("company_payment_info", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      companyName: varchar("company_name").notNull().default("Breathwork EHF"),
      companyId: varchar("company_id").notNull().default(""),
      // Kennitala
      bankName: varchar("bank_name").notNull(),
      accountNumber: varchar("account_number").notNull(),
      // Format: 0123-26-004567
      iban: varchar("iban"),
      swiftBic: varchar("swift_bic"),
      instructions: text("instructions"),
      // Additional payment instructions in Icelandic
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    vouchers = pgTable("vouchers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: varchar("code").unique().notNull(),
      type: varchar("type", { enum: ["gift_card", "discount", "free_session"] }).notNull(),
      value: decimal("value", { precision: 10, scale: 2 }),
      // Amount or percentage
      isPercentage: boolean("is_percentage").default(false),
      validFrom: timestamp("valid_from").defaultNow(),
      validUntil: timestamp("valid_until"),
      usageLimit: integer("usage_limit").default(1),
      usedCount: integer("used_count").default(0),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    customerInvoices = pgTable("customer_invoices", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      invoiceNumber: varchar("invoice_number").unique().notNull(),
      // e.g., "INV-2025-001"
      registrationId: varchar("registration_id").references(() => registrations.id),
      clientId: varchar("client_id").references(() => users.id).notNull(),
      amount: integer("amount").notNull(),
      // in ISK
      description: text("description"),
      status: varchar("status", { enum: ["draft", "sent", "paid", "cancelled"] }).default("draft").notNull(),
      pdfUrl: varchar("pdf_url"),
      // Supabase storage URL
      sentAt: timestamp("sent_at"),
      paidAt: timestamp("paid_at"),
      dueDate: timestamp("due_date"),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    companyInvoices = pgTable("company_invoices", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      invoiceNumber: varchar("invoice_number").notNull(),
      vendor: varchar("vendor").notNull(),
      // e.g., "Amazon Web Services"
      category: varchar("category").notNull(),
      // e.g., "Software", "Marketing", "Equipment"
      amount: integer("amount").notNull(),
      // in ISK
      currency: varchar("currency").default("ISK").notNull(),
      description: text("description"),
      invoiceDate: timestamp("invoice_date").notNull(),
      dueDate: timestamp("due_date"),
      paidDate: timestamp("paid_date"),
      status: varchar("status", { enum: ["pending", "paid", "overdue"] }).default("pending").notNull(),
      pdfUrl: varchar("pdf_url").notNull(),
      // Supabase storage URL
      uploadedBy: varchar("uploaded_by").references(() => users.id),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ many, one }) => ({
      bookings: many(bookings),
      waitlistEntries: many(waitlist),
      instructor: one(instructors, {
        fields: [users.id],
        references: [instructors.userId]
      })
    }));
    instructorsRelations = relations(instructors, ({ one, many }) => ({
      user: one(users, {
        fields: [instructors.userId],
        references: [users.id]
      }),
      availability: many(availability),
      timeSlots: many(timeSlots),
      bookings: many(bookings),
      blockedTimes: many(blockedTimes)
    }));
    servicesRelations = relations(services, ({ many }) => ({
      bookings: many(bookings),
      timeSlots: many(timeSlots),
      waitlistEntries: many(waitlist)
    }));
    bookingsRelations = relations(bookings, ({ one }) => ({
      client: one(users, {
        fields: [bookings.clientId],
        references: [users.id]
      }),
      service: one(services, {
        fields: [bookings.serviceId],
        references: [services.id]
      }),
      instructor: one(instructors, {
        fields: [bookings.instructorId],
        references: [instructors.id]
      }),
      timeSlot: one(timeSlots, {
        fields: [bookings.timeSlotId],
        references: [timeSlots.id]
      })
    }));
    timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
      instructor: one(instructors, {
        fields: [timeSlots.instructorId],
        references: [instructors.id]
      }),
      service: one(services, {
        fields: [timeSlots.serviceId],
        references: [services.id]
      }),
      bookings: many(bookings),
      waitlistEntries: many(waitlist)
    }));
    waitlistRelations = relations(waitlist, ({ one }) => ({
      client: one(users, {
        fields: [waitlist.clientId],
        references: [users.id]
      }),
      timeSlot: one(timeSlots, {
        fields: [waitlist.timeSlotId],
        references: [timeSlots.id]
      }),
      service: one(services, {
        fields: [waitlist.serviceId],
        references: [services.id]
      })
    }));
    insertClassTemplateSchema = createInsertSchema(classTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertClassSchema = createInsertSchema(classes).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      currentBookings: true
    }).extend({
      scheduledDate: z.string().or(z.date()).transform(
        (val) => typeof val === "string" ? new Date(val) : val
      )
    });
    insertRegistrationSchema = createInsertSchema(registrations).omit({
      id: true,
      clientId: true,
      // Comes from authenticated user session
      createdAt: true,
      updatedAt: true
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
    loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional()
    });
    insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
    insertInstructorSchema = createInsertSchema(instructors).omit({ id: true, createdAt: true, updatedAt: true });
    insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true });
    insertAvailabilitySchema = createInsertSchema(availability).omit({ id: true, createdAt: true });
    insertTimeSlotSchema = createInsertSchema(timeSlots).omit({ id: true, createdAt: true }).extend({
      startTime: z.string().or(z.date()).transform((val) => typeof val === "string" ? new Date(val) : val),
      endTime: z.string().or(z.date()).transform((val) => typeof val === "string" ? new Date(val) : val)
    });
    insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
    insertBlockedTimeSchema = createInsertSchema(blockedTimes).omit({ id: true, createdAt: true });
    insertVoucherSchema = createInsertSchema(vouchers).omit({ id: true, createdAt: true });
    insertCompanyPaymentInfoSchema = createInsertSchema(companyPaymentInfo).omit({ id: true, createdAt: true, updatedAt: true });
    insertCustomerInvoiceSchema = createInsertSchema(customerInvoices).omit({ id: true, createdAt: true, updatedAt: true });
    insertCompanyInvoiceSchema = createInsertSchema(companyInvoices).omit({ id: true, createdAt: true, updatedAt: true });
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import cookieParser from "cookie-parser";

// server/storage.ts
init_schema();

// server/db.ts
init_schema();
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, desc, asc, sql as sql2, count, inArray } from "drizzle-orm";

// server/utils/logger.ts
var isDevelopment = process.env.NODE_ENV === "development";
var isProduction = process.env.NODE_ENV === "production";
var Logger = class {
  shouldLog(level) {
    if (isDevelopment) return true;
    if (isProduction) {
      return level === "error" /* ERROR */ || level === "warn" /* WARN */;
    }
    return false;
  }
  formatLog(level, message, data, context) {
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) : void 0,
      userId: context?.userId,
      requestId: context?.requestId
    };
  }
  sanitizeData(data) {
    if (typeof data !== "object" || data === null) return data;
    const sanitized = { ...data };
    const sensitiveFields = ["password", "passwordHash", "token", "secret", "key", "authorization"];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    });
    return sanitized;
  }
  log(level, message, data, context) {
    if (!this.shouldLog(level)) return;
    const logEntry = this.formatLog(level, message, data, context);
    if (isDevelopment) {
      console[level](`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, data ? logEntry.data : "");
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
  error(message, data, context) {
    this.log("error" /* ERROR */, message, data, context);
  }
  warn(message, data, context) {
    this.log("warn" /* WARN */, message, data, context);
  }
  info(message, data, context) {
    this.log("info" /* INFO */, message, data, context);
  }
  debug(message, data, context) {
    this.log("debug" /* DEBUG */, message, data, context);
  }
};
var logger = new Logger();

// server/storage.ts
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Service operations
  async getServices() {
    return await db.select().from(services).orderBy(asc(services.name));
  }
  async getActiveServices() {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.name));
  }
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  async createService(service) {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  async updateService(id, service) {
    const [updatedService] = await db.update(services).set({ ...service, updatedAt: /* @__PURE__ */ new Date() }).where(eq(services.id, id)).returning();
    return updatedService;
  }
  async deleteService(id) {
    await db.delete(services).where(eq(services.id, id));
  }
  // Instructor operations
  async getInstructors() {
    return await db.select().from(instructors).innerJoin(users, eq(instructors.userId, users.id)).orderBy(asc(users.firstName));
  }
  async getActiveInstructors() {
    return await db.select().from(instructors).innerJoin(users, eq(instructors.userId, users.id)).where(eq(instructors.isActive, true)).orderBy(asc(users.firstName));
  }
  async getInstructor(id) {
    const result = await db.select().from(instructors).innerJoin(users, eq(instructors.userId, users.id)).where(eq(instructors.id, id));
    return result[0] || void 0;
  }
  async getInstructorByUserId(userId) {
    const result = await db.select().from(instructors).innerJoin(users, eq(instructors.userId, users.id)).where(eq(instructors.userId, userId));
    return result[0] || void 0;
  }
  async createInstructor(instructor) {
    const [newInstructor] = await db.insert(instructors).values(instructor).returning();
    return newInstructor;
  }
  async updateInstructor(id, instructor) {
    const [updatedInstructor] = await db.update(instructors).set({ ...instructor, updatedAt: /* @__PURE__ */ new Date() }).where(eq(instructors.id, id)).returning();
    return updatedInstructor;
  }
  // Availability operations
  async getInstructorAvailability(instructorId) {
    return await db.select().from(availability).where(and(eq(availability.instructorId, instructorId), eq(availability.isActive, true))).orderBy(asc(availability.dayOfWeek), asc(availability.startTime));
  }
  async createAvailability(availabilityData) {
    const [newAvailability] = await db.insert(availability).values(availabilityData).returning();
    return newAvailability;
  }
  async updateAvailability(id, availabilityData) {
    const [updatedAvailability] = await db.update(availability).set(availabilityData).where(eq(availability.id, id)).returning();
    return updatedAvailability;
  }
  async deleteAvailability(id) {
    await db.delete(availability).where(eq(availability.id, id));
  }
  // Time slot operations
  async getAvailableTimeSlots(serviceId, startDate, endDate) {
    return await db.select().from(timeSlots).innerJoin(instructors, eq(timeSlots.instructorId, instructors.id)).innerJoin(users, eq(instructors.userId, users.id)).where(
      and(
        eq(timeSlots.serviceId, serviceId),
        eq(timeSlots.isAvailable, true),
        gte(timeSlots.startTime, startDate),
        lte(timeSlots.startTime, endDate)
      )
    ).orderBy(asc(timeSlots.startTime));
  }
  async getAllTimeSlots(serviceId, startDate, endDate) {
    return await db.select().from(timeSlots).innerJoin(instructors, eq(timeSlots.instructorId, instructors.id)).innerJoin(users, eq(instructors.userId, users.id)).where(
      and(
        eq(timeSlots.serviceId, serviceId),
        gte(timeSlots.startTime, startDate),
        lte(timeSlots.startTime, endDate)
      )
    ).orderBy(asc(timeSlots.startTime));
  }
  async getUpcomingTimeSlots(startDate, endDate) {
    return await db.select().from(timeSlots).innerJoin(instructors, eq(timeSlots.instructorId, instructors.id)).innerJoin(users, eq(instructors.userId, users.id)).innerJoin(services, eq(timeSlots.serviceId, services.id)).where(
      and(
        gte(timeSlots.startTime, startDate),
        lte(timeSlots.startTime, endDate)
      )
    ).orderBy(asc(timeSlots.startTime));
  }
  async getTimeSlot(id) {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot;
  }
  async createTimeSlot(timeSlot) {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }
  async updateTimeSlot(id, timeSlot) {
    const [updatedTimeSlot] = await db.update(timeSlots).set(timeSlot).where(eq(timeSlots.id, id)).returning();
    return updatedTimeSlot;
  }
  async deleteTimeSlot(id) {
    await db.delete(timeSlots).where(eq(timeSlots.id, id));
  }
  // Booking operations
  async getUserBookings(userId) {
    return await db.select().from(bookings).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(instructors, eq(bookings.instructorId, instructors.id)).innerJoin(users, eq(instructors.userId, users.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).where(eq(bookings.clientId, userId)).orderBy(desc(timeSlots.startTime));
  }
  async getInstructorBookings(instructorId, startDate, endDate) {
    let conditions = [eq(bookings.instructorId, instructorId)];
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }
    return await db.select().from(bookings).innerJoin(users, eq(bookings.clientId, users.id)).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).where(and(...conditions)).orderBy(asc(timeSlots.startTime));
  }
  async getAllBookings(startDate, endDate) {
    let conditions = [];
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    return await db.select().from(bookings).innerJoin(users, eq(bookings.clientId, users.id)).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(instructors, eq(bookings.instructorId, instructors.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).where(whereClause).orderBy(desc(timeSlots.startTime));
  }
  async getBooking(id) {
    const result = await db.select().from(bookings).innerJoin(users, eq(bookings.clientId, users.id)).innerJoin(services, eq(bookings.serviceId, services.id)).innerJoin(instructors, eq(bookings.instructorId, instructors.id)).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).where(eq(bookings.id, id));
    return result[0];
  }
  async createBooking(booking) {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    const service = await this.getService(booking.serviceId);
    if (service && service.maxCapacity === 1) {
      await this.updateTimeSlot(booking.timeSlotId, { isAvailable: false });
    }
    return newBooking;
  }
  async updateBooking(id, booking) {
    const [updatedBooking] = await db.update(bookings).set({ ...booking, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    return updatedBooking;
  }
  async cancelBooking(id) {
    const [cancelledBooking] = await db.update(bookings).set({
      status: "cancelled",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(bookings.id, id)).returning();
    await this.updateTimeSlot(cancelledBooking.timeSlotId, { isAvailable: true });
    return cancelledBooking;
  }
  // Waitlist operations
  async addToWaitlist(waitlistEntry) {
    const [maxPosition] = await db.select({ max: sql2`COALESCE(MAX(position), 0)` }).from(waitlist).where(eq(waitlist.timeSlotId, waitlistEntry.timeSlotId));
    const position = (maxPosition?.max || 0) + 1;
    const [newWaitlistEntry] = await db.insert(waitlist).values({ ...waitlistEntry, position }).returning();
    return newWaitlistEntry;
  }
  async getWaitlistPosition(clientId, timeSlotId) {
    const [entry] = await db.select({ position: waitlist.position }).from(waitlist).where(
      and(
        eq(waitlist.clientId, clientId),
        eq(waitlist.timeSlotId, timeSlotId),
        eq(waitlist.isActive, true)
      )
    );
    return entry?.position || null;
  }
  async getWaitlist(timeSlotId) {
    return await db.select().from(waitlist).innerJoin(users, eq(waitlist.clientId, users.id)).where(and(eq(waitlist.timeSlotId, timeSlotId), eq(waitlist.isActive, true))).orderBy(asc(waitlist.position));
  }
  async removeFromWaitlist(id) {
    await db.update(waitlist).set({ isActive: false }).where(eq(waitlist.id, id));
  }
  async getNextWaitlistUser(timeSlotId) {
    const results = await db.select().from(waitlist).innerJoin(users, eq(waitlist.clientId, users.id)).where(and(eq(waitlist.timeSlotId, timeSlotId), eq(waitlist.isActive, true))).orderBy(asc(waitlist.position)).limit(1);
    return results[0];
  }
  // Blocked time operations
  async getBlockedTimes(instructorId, startDate, endDate) {
    let conditions = [];
    if (instructorId) {
      conditions.push(eq(blockedTimes.instructorId, instructorId));
    }
    if (startDate) {
      conditions.push(gte(blockedTimes.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(blockedTimes.startTime, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    return await db.select().from(blockedTimes).where(whereClause).orderBy(asc(blockedTimes.startTime));
  }
  async createBlockedTime(blockedTime) {
    const [newBlockedTime] = await db.insert(blockedTimes).values(blockedTime).returning();
    return newBlockedTime;
  }
  async deleteBlockedTime(id) {
    await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
  }
  // Voucher operations
  async getVoucher(code) {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.code, code));
    return voucher;
  }
  async validateVoucher(code) {
    const voucher = await this.getVoucher(code);
    if (!voucher) {
      return { valid: false, error: "Voucher not found" };
    }
    if (!voucher.isActive) {
      return { valid: false, error: "Voucher is no longer active" };
    }
    if (voucher.validUntil && /* @__PURE__ */ new Date() > voucher.validUntil) {
      return { valid: false, error: "Voucher has expired" };
    }
    if ((voucher.usedCount ?? 0) >= (voucher.usageLimit ?? 1)) {
      return { valid: false, error: "Voucher usage limit reached" };
    }
    return { valid: true, voucher };
  }
  async useVoucher(code) {
    const [updatedVoucher] = await db.update(vouchers).set({
      usedCount: sql2`${vouchers.usedCount} + 1`
    }).where(eq(vouchers.code, code)).returning();
    return updatedVoucher;
  }
  // Analytics operations
  async getBookingStats(startDate, endDate) {
    let conditions = [];
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const stats = await db.select({
      totalBookings: count(),
      totalRevenue: sql2`COALESCE(SUM(${bookings.totalAmount}), 0)`,
      pendingBookings: sql2`COUNT(CASE WHEN ${bookings.status} = 'pending' THEN 1 END)`,
      completedBookings: sql2`COUNT(CASE WHEN ${bookings.status} = 'completed' THEN 1 END)`,
      cancelledBookings: sql2`COUNT(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 END)`
    }).from(bookings).innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id)).where(whereClause);
    return stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0
    };
  }
  // NEW: Class template operations
  async getClassTemplates() {
    return await db.select().from(classTemplates).where(eq(classTemplates.isActive, true)).orderBy(desc(classTemplates.isDefault), asc(classTemplates.name));
  }
  async getClassTemplate(id) {
    const [template] = await db.select().from(classTemplates).where(eq(classTemplates.id, id));
    return template;
  }
  async getDefaultClassTemplate() {
    const [template] = await db.select().from(classTemplates).where(eq(classTemplates.isDefault, true));
    return template;
  }
  async createClassTemplate(template) {
    const [newTemplate] = await db.insert(classTemplates).values(template).returning();
    return newTemplate;
  }
  // NEW: Class operations
  async getAllClasses() {
    const results = await db.select().from(classes).innerJoin(classTemplates, eq(classes.templateId, classTemplates.id)).orderBy(desc(classes.scheduledDate));
    return results.map((row) => ({
      ...row.classes,
      template: row.class_templates
    }));
  }
  async getUpcomingClasses() {
    const results = await db.select().from(classes).innerJoin(classTemplates, eq(classes.templateId, classTemplates.id)).where(and(
      eq(classes.status, "upcoming"),
      gte(classes.scheduledDate, /* @__PURE__ */ new Date())
    )).orderBy(asc(classes.scheduledDate));
    return results.map((row) => ({
      ...row.classes,
      template: row.class_templates
    }));
  }
  async getClass(id) {
    const results = await db.select().from(classes).innerJoin(classTemplates, eq(classes.templateId, classTemplates.id)).where(eq(classes.id, id));
    if (results.length === 0) return void 0;
    return {
      ...results[0].classes,
      template: results[0].class_templates
    };
  }
  async createClass(classData) {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }
  async updateClass(id, classData) {
    const [updatedClass] = await db.update(classes).set({ ...classData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(classes.id, id)).returning();
    return updatedClass;
  }
  async deleteClass(id) {
    console.log(`[storage.deleteClass] Starting deletion for class ${id}`);
    const deletedRegs = await db.delete(registrations).where(eq(registrations.classId, id)).returning();
    console.log(`[storage.deleteClass] Deleted ${deletedRegs.length} registrations`);
    const deletedClasses = await db.delete(classes).where(eq(classes.id, id)).returning();
    console.log(`[storage.deleteClass] Deleted ${deletedClasses.length} classes`);
  }
  // NEW: Registration operations
  async getUserRegistrations(userId) {
    const results = await db.select().from(registrations).innerJoin(classes, eq(registrations.classId, classes.id)).innerJoin(classTemplates, eq(classes.templateId, classTemplates.id)).where(eq(registrations.clientId, userId)).orderBy(desc(classes.scheduledDate));
    return results.map((row) => ({
      ...row.registrations,
      class: {
        ...row.classes,
        template: row.class_templates
      }
    }));
  }
  async getClassRegistrations(classId) {
    const results = await db.select().from(registrations).innerJoin(users, eq(registrations.clientId, users.id)).where(eq(registrations.classId, classId)).orderBy(asc(registrations.createdAt));
    return results.map((row) => ({
      ...row.registrations,
      client: row.users
    }));
  }
  async fixClassBookingsCounter(classId) {
    const registrationsList = await this.getClassRegistrations(classId);
    const actualCount = registrationsList.length;
    await db.update(classes).set({ currentBookings: actualCount }).where(eq(classes.id, classId));
    return actualCount;
  }
  // Optimized method to fix all class counters in one query
  async fixAllClassCounters() {
    const allClasses = await db.select().from(classes);
    const registrationCounts = await db.select({
      classId: registrations.classId,
      count: sql2`COUNT(*)`.as("count")
    }).from(registrations).where(eq(registrations.status, "confirmed")).groupBy(registrations.classId);
    const countMap = new Map(registrationCounts.map((r) => [r.classId, r.count]));
    const fixed = [];
    for (const classItem of allClasses) {
      const actualCount = countMap.get(classItem.id) || 0;
      if (classItem.currentBookings !== actualCount) {
        await db.update(classes).set({ currentBookings: actualCount }).where(eq(classes.id, classItem.id));
        fixed.push({
          classId: classItem.id,
          oldCount: classItem.currentBookings,
          newCount: actualCount
        });
      }
    }
    return fixed;
  }
  async deleteRegistration(id) {
    const registration = await this.getRegistration(id);
    if (!registration) {
      throw new Error("Registration not found");
    }
    await db.delete(registrations).where(eq(registrations.id, id));
    await db.update(classes).set({ currentBookings: sql2`${classes.currentBookings} - 1` }).where(eq(classes.id, registration.classId));
    logger.info("Registration deleted", {
      registrationId: id,
      classId: registration.classId
    });
  }
  async getRegistration(id) {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
    return registration;
  }
  async createRegistration(registration) {
    const [newRegistration] = await db.insert(registrations).values(registration).returning();
    await db.update(classes).set({ currentBookings: sql2`${classes.currentBookings} + 1` }).where(eq(classes.id, registration.classId));
    return newRegistration;
  }
  async updateRegistration(id, registration) {
    const [updatedRegistration] = await db.update(registrations).set({ ...registration, updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, id)).returning();
    return updatedRegistration;
  }
  async cancelRegistration(id) {
    const [registration] = await db.update(registrations).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, id)).returning();
    await db.update(classes).set({ currentBookings: sql2`${classes.currentBookings} - 1` }).where(eq(classes.id, registration.classId));
    return registration;
  }
  async getRegistrationWithDetails(id) {
    const result = await db.select().from(registrations).leftJoin(classes, eq(registrations.classId, classes.id)).leftJoin(classTemplates, eq(classes.templateId, classTemplates.id)).where(eq(registrations.id, id)).limit(1);
    if (!result.length || !result[0].classes || !result[0].class_templates) {
      return void 0;
    }
    return {
      ...result[0].registrations,
      class: {
        ...result[0].classes,
        template: result[0].class_templates
      }
    };
  }
  async getActivePaymentInfo() {
    const { companyPaymentInfo: companyPaymentInfo2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const result = await db.select().from(companyPaymentInfo2).where(eq(companyPaymentInfo2.isActive, true));
    return result;
  }
  async deleteExpiredRegistrations() {
    const now = /* @__PURE__ */ new Date();
    const expiredRegistrations = await db.select().from(registrations).where(
      and(
        lte(registrations.paymentDeadline, now),
        eq(registrations.adminVerifiedPayment, false),
        eq(registrations.status, "confirmed")
      )
    );
    if (expiredRegistrations.length === 0) {
      return 0;
    }
    const deletedIds = expiredRegistrations.map((r) => r.id);
    await db.delete(registrations).where(inArray(registrations.id, deletedIds));
    for (const reg of expiredRegistrations) {
      await db.update(classes).set({ currentBookings: sql2`${classes.currentBookings} - 1` }).where(eq(classes.id, reg.classId));
    }
    console.log(`Deleted ${expiredRegistrations.length} expired registrations`);
    return expiredRegistrations.length;
  }
  // Customer Invoice operations
  async createCustomerInvoice(data) {
    const [invoice] = await db.insert(customerInvoices).values(data).returning();
    return invoice;
  }
  async getCustomerInvoices() {
    return await db.select().from(customerInvoices).orderBy(desc(customerInvoices.createdAt));
  }
  async getCustomerInvoice(id) {
    const [invoice] = await db.select().from(customerInvoices).where(eq(customerInvoices.id, id));
    return invoice;
  }
  async updateCustomerInvoice(id, data) {
    const [updated] = await db.update(customerInvoices).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customerInvoices.id, id)).returning();
    return updated;
  }
  async getCustomerInvoicesByClient(clientId) {
    return await db.select().from(customerInvoices).where(eq(customerInvoices.clientId, clientId)).orderBy(desc(customerInvoices.createdAt));
  }
  // Company Invoice operations
  async createCompanyInvoice(data) {
    const [invoice] = await db.insert(companyInvoices).values(data).returning();
    return invoice;
  }
  async getCompanyInvoices() {
    return await db.select().from(companyInvoices).orderBy(desc(companyInvoices.createdAt));
  }
  async getCompanyInvoice(id) {
    const [invoice] = await db.select().from(companyInvoices).where(eq(companyInvoices.id, id));
    return invoice;
  }
  async updateCompanyInvoice(id, data) {
    const [updated] = await db.update(companyInvoices).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companyInvoices.id, id)).returning();
    return updated;
  }
  async deleteCompanyInvoice(id) {
    await db.delete(companyInvoices).where(eq(companyInvoices.id, id));
  }
};
var storage = new DatabaseStorage();

// server/middleware/rateLimiting.ts
import rateLimit from "express-rate-limit";
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // limit each IP to 5 login attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
  // Don't count successful requests
});
var registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // limit each IP to 3 registrations per hour
  message: {
    error: "Too many registration attempts, please try again later.",
    retryAfter: "1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false
});
var passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // limit each IP to 3 password reset attempts per hour
  message: {
    error: "Too many password reset attempts, please try again later.",
    retryAfter: "1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// server/middleware/validation.ts
import { z as z2 } from "zod";

// server/utils/sanitizer.ts
function sanitizeHtml(input) {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/&#x60;/g, "`").replace(/&#x3D;/g, "=").replace(/[<>]/g, "").substring(0, 1e3);
}
function sanitizeText(input) {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").substring(0, 500);
}
function sanitizeEmail(input) {
  if (typeof input !== "string") return "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = input.trim().toLowerCase();
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }
  return sanitized.substring(0, 254);
}
function sanitizeNumeric(input) {
  if (typeof input === "number") return input.toString();
  if (typeof input !== "string") return "0";
  const cleaned = input.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? "0" : parsed.toString();
}

// server/middleware/validation.ts
var commonSchemas = {
  id: z2.string().uuid("Invalid ID format"),
  email: z2.string().email("Invalid email format").transform(sanitizeEmail),
  phone: z2.string().min(8).max(20).optional(),
  name: z2.string().min(1).max(100).transform(sanitizeText),
  description: z2.string().max(1e3).transform(sanitizeHtml),
  price: z2.number().positive().transform(sanitizeNumeric),
  date: z2.string().datetime().or(z2.date()),
  boolean: z2.boolean(),
  positiveInt: z2.number().int().positive(),
  nonNegativeInt: z2.number().int().min(0)
};
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z2.ZodError) {
        logger.warn("Validation error", {
          errors: error.errors,
          body: req.body,
          path: req.path
        });
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code
          }))
        });
      }
      logger.error("Validation middleware error", { error: error.message });
      res.status(500).json({ message: "Internal validation error" });
    }
  };
}
var validationSchemas = {
  // User registration
  register: z2.object({
    email: commonSchemas.email,
    password: z2.string().min(8).max(128),
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone
  }),
  // User login
  login: z2.object({
    email: commonSchemas.email,
    password: z2.string().min(1)
  }),
  // Class creation
  createClass: z2.object({
    templateId: commonSchemas.id,
    scheduledDate: commonSchemas.date,
    location: commonSchemas.name,
    maxCapacity: commonSchemas.positiveInt,
    customPrice: commonSchemas.price.optional(),
    instructorNotes: commonSchemas.description.optional()
  }),
  // Registration
  createRegistration: z2.object({
    classId: commonSchemas.id,
    paymentAmount: commonSchemas.price,
    paymentMethod: z2.enum(["bank_transfer", "pay_on_arrival"]).default("bank_transfer"),
    notes: commonSchemas.description.optional()
  }),
  // Time slot creation
  createTimeSlot: z2.object({
    instructorId: commonSchemas.id,
    serviceId: commonSchemas.id,
    startTime: commonSchemas.date,
    endTime: commonSchemas.date
  }),
  // Pagination
  pagination: z2.object({
    page: commonSchemas.nonNegativeInt.default(1),
    limit: z2.number().int().min(1).max(100).default(20),
    sortBy: z2.string().optional(),
    sortOrder: z2.enum(["asc", "desc"]).default("desc")
  }),
  // Date range
  dateRange: z2.object({
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional()
  })
};
function sanitizeInputs(req, res, next) {
  const sanitizeObject = (obj) => {
    if (typeof obj === "string") {
      return sanitizeText(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (["password", "passwordHash", "token", "secret"].includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
      return sanitized;
    }
    return obj;
  };
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

// server/supabaseAuth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
var JWT_EXPIRES_IN = "7d";
async function isAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: "Session expired" });
      } else {
        res.status(401).json({ message: "Invalid session" });
      }
      return;
    }
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    req.user = {
      id: user.id,
      email: user.email
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function createSession(userId, email) {
  const payload = {
    userId,
    email
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}
function deleteSession(_token) {
}

// server/email.ts
import { Resend } from "resend";
var resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
var FROM_EMAIL = process.env.FROM_EMAIL || "bookings@breathwork.is";
async function sendRegistrationConfirmation(data) {
  if (!resend) {
    console.warn("Resend not configured - skipping email send");
    return false;
  }
  const { registration, classItem, user, paymentInfo } = data;
  try {
    const classDate = new Date(classItem.scheduledDate);
    const formattedDate = new Intl.DateTimeFormat("is-IS", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(classDate);
    const formattedTime = new Intl.DateTimeFormat("is-IS", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(classDate);
    const price = classItem.customPrice || classItem.template.price;
    const emailHtml = `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>B\xF3kun sta\xF0fest - Breathwork</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">\u{1F32C}\uFE0F Breathwork</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">\xD6ndunar\xE6fingar \xE1 \xCDslandi</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #667eea; margin-top: 0;">B\xF3kun \xFE\xEDn hefur veri\xF0 sta\xF0fest! \u2713</h2>

    <p>G\xF3\xF0an daginn ${sanitizeText(user.firstName || "")},</p>

    <p>\xDE\xFA hefur skr\xE1\xF0 \xFEig \xED \xF6ndunar\xE6fingu. H\xE9r a\xF0 ne\xF0an eru allar uppl\xFDsingar um t\xEDmann \xFEinn:</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #667eea; font-size: 20px;">${sanitizeHtml(classItem.template.name)}</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>B\xF3kunarn\xFAmer:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${sanitizeText(registration.paymentReference || registration.id.substring(0, 10).toUpperCase())}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Dagsetning:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>T\xEDmi:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${formattedTime} \xB7 ${classItem.template.duration} m\xEDn</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>Sta\xF0setning:</strong></td>
          <td style="padding: 8px 0; text-align: right;">${sanitizeText(classItem.location)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; border-top: 2px solid #e0e0e0; padding-top: 15px;"><strong>Upph\xE6\xF0:</strong></td>
          <td style="padding: 8px 0; text-align: right; border-top: 2px solid #e0e0e0; padding-top: 15px; font-size: 18px; color: #667eea;"><strong>${price.toLocaleString("is-IS")} kr.</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #856404;">\u{1F4B3} Grei\xF0sluuppl\xFDsingar</h3>
      <p style="margin: 10px 0; color: #856404;"><strong>Vinsamlegast greiddu innan 24 klst.</strong></p>

      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Banki:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404;">${sanitizeText(paymentInfo.bankName)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Reikningsn\xFAmer:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404; font-family: 'Courier New', monospace; font-weight: bold;">${sanitizeText(paymentInfo.accountNumber)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Kennitala:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404;">${sanitizeText(paymentInfo.companyName)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #856404;"><strong>Tilvitnun:</strong></td>
          <td style="padding: 5px 0; text-align: right; color: #856404; font-family: 'Courier New', monospace; font-weight: bold;">${sanitizeText(registration.paymentReference || registration.id.substring(0, 10).toUpperCase())}</td>
        </tr>
      </table>

      <p style="margin: 15px 0 5px 0; color: #856404; font-size: 14px;"><em>Mikilv\xE6gt: Vinsamlegast nota\xF0u b\xF3kunarn\xFAmeri\xF0 \xFEitt sem tilvitnun vi\xF0 grei\xF0slu.</em></p>
    </div>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #0066cc;">\u2139\uFE0F Mikilv\xE6gar uppl\xFDsingar</h3>
      <ul style="margin: 10px 0; padding-left: 20px; color: #0066cc;">
        <li>Komdu 15 m\xEDn\xFAtum fyrir t\xEDmann</li>
        <li>Kl\xE6\xF0stu \xED \xFE\xE6gilegan fatna\xF0</li>
        <li>Ekki bor\xF0a \xFEungan mat 2 klst. fyrir t\xEDmann</li>
        <li>Taktu me\xF0 vatn</li>
      </ul>
    </div>

    <div style="margin: 30px 0; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <h3 style="color: #333;">Um \xF6ndunar\xE6finguna</h3>
      <p style="color: #666; line-height: 1.8;">${sanitizeHtml(classItem.template.description)}</p>
    </div>

    <p style="margin-top: 30px; color: #666;">
      <strong>Spurningar?</strong><br>
      Haf\xF0u samband vi\xF0 okkur ef \xFE\xFA hefur einhverjar spurningar.
    </p>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 14px; margin: 0;">Hl\xF6kkum til a\xF0 sj\xE1 \xFEig!</p>
      <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Breathwork ehf.</p>
    </div>

  </div>

</body>
</html>
    `;
    await resend.emails.send({
      from: `Breathwork <${FROM_EMAIL}>`,
      to: [sanitizeEmail(user.email)],
      subject: `B\xF3kun sta\xF0fest - ${sanitizeText(classItem.template.name)} - ${formattedDate}`,
      html: emailHtml
    });
    logger.info("Confirmation email sent", { email: user.email });
    return true;
  } catch (error) {
    logger.error("Failed to send confirmation email", { error: error.message });
    return false;
  }
}

// server/routes.ts
init_schema();
import { z as z3 } from "zod";
function isAdminOrSuperuser(user) {
  return user?.role === "admin" || user?.isSuperuser === true;
}
async function registerRoutes(app2) {
  app2.use(cookieParser());
  app2.use("/api", generalLimiter);
  app2.use("/api", sanitizeInputs);
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  app2.post("/api/auth/register", registrationLimiter, validateBody(validationSchemas.register), async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "client"
        // Default role
      });
      const token = createSession(user.id, user.email);
      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      logger.error("Registration failed", { error: error.message }, { requestId: req.headers["x-request-id"] });
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", authLimiter, validateBody(validationSchemas.login), async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = createSession(user.id, user.email);
      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      logger.error("Login failed", { error: error.message }, { requestId: req.headers["x-request-id"] });
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (token) {
        deleteSession(token);
      }
      res.clearCookie("session_token");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error("Logout error:", { error: error.message });
      res.status(500).json({ message: "Logout failed" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error("Error fetching user:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map((u) => {
        const { passwordHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      logger.error("Error fetching users:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/services", async (_req, res) => {
    try {
      const services2 = await storage.getActiveServices();
      res.json(services2);
    } catch (error) {
      logger.error("Error fetching services:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      logger.error("Error fetching service:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });
  app2.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      logger.error("Error creating service:", { error: error.message });
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });
  app2.put("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, serviceData);
      res.json(service);
    } catch (error) {
      logger.error("Error updating service:", { error: error.message });
      res.status(500).json({ message: "Failed to update service" });
    }
  });
  app2.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      logger.error("Error deleting service:", { error: error.message });
      res.status(500).json({ message: "Failed to delete service" });
    }
  });
  app2.get("/api/instructors", async (_req, res) => {
    try {
      const instructors2 = await storage.getActiveInstructors();
      res.json(instructors2);
    } catch (error) {
      logger.error("Error fetching instructors:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });
  app2.get("/api/instructors/:id", async (req, res) => {
    try {
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      res.json(instructor);
    } catch (error) {
      logger.error("Error fetching instructor:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch instructor" });
    }
  });
  app2.get("/api/time-slots/admin", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : /* @__PURE__ */ new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3);
      const allTimeSlots = await storage.getUpcomingTimeSlots(start, end);
      res.json(allTimeSlots);
    } catch (error) {
      logger.error("Error fetching admin time slots:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });
  app2.get("/api/time-slots", async (req, res) => {
    try {
      const { serviceId, startDate, endDate, includeUnavailable } = req.query;
      if (!serviceId || !startDate || !endDate) {
        return res.status(400).json({ message: "serviceId, startDate, and endDate are required" });
      }
      const timeSlots2 = await storage.getAvailableTimeSlots(
        serviceId,
        new Date(startDate),
        new Date(endDate)
      );
      if (includeUnavailable === "true") {
        const allTimeSlots = await storage.getAllTimeSlots(
          serviceId,
          new Date(startDate),
          new Date(endDate)
        );
        res.json(allTimeSlots);
      } else {
        res.json(timeSlots2);
      }
    } catch (error) {
      logger.error("Error fetching time slots:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });
  app2.post("/api/time-slots", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      logger.error("Error creating time slot:", { error: error.message });
      res.status(500).json({ message: "Failed to create time slot" });
    }
  });
  app2.delete("/api/time-slots/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteTimeSlot(req.params.id);
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      logger.error("Error deleting time slot:", { error: error.message });
      res.status(500).json({ message: "Failed to delete time slot" });
    }
  });
  app2.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role === "client") {
        const bookings2 = await storage.getUserBookings(user.id);
        res.json(bookings2);
      } else if (isAdminOrSuperuser(user)) {
        const bookings2 = await storage.getAllBookings();
        res.json(bookings2);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      logger.error("Error fetching bookings:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(req.user.id);
      if (user?.role === "client" && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!isAdminOrSuperuser(user) && user?.role !== "client") {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(booking);
    } catch (error) {
      logger.error("Error fetching booking:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });
  app2.post("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        clientId: userId
      });
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      logger.error("Error creating booking:", { error: error.message });
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  app2.put("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(req.user.id);
      if (user?.role === "client" && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updateData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(req.params.id, updateData);
      res.json(updatedBooking);
    } catch (error) {
      logger.error("Error updating booking:", { error: error.message });
      res.status(500).json({ message: "Failed to update booking" });
    }
  });
  app2.delete("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(req.user.id);
      if (user?.role === "client" && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const cancelledBooking = await storage.cancelBooking(req.params.id);
      const nextWaitlistUser = await storage.getNextWaitlistUser(booking.bookings.timeSlotId);
      res.json({
        booking: cancelledBooking,
        nextWaitlistUser: nextWaitlistUser ? {
          name: `${nextWaitlistUser.users.firstName} ${nextWaitlistUser.users.lastName}`,
          email: nextWaitlistUser.users.email,
          position: nextWaitlistUser.waitlist.position
        } : null
      });
    } catch (error) {
      logger.error("Error cancelling booking:", { error: error.message });
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });
  app2.patch("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const authenticatedUser = await storage.getUser(userId);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { newTimeSlotId } = req.body;
      if (!newTimeSlotId) {
        return res.status(400).json({ message: "New time slot ID is required" });
      }
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (authenticatedUser.role === "client" && booking.bookings.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const newSlot = await storage.getTimeSlot(newTimeSlotId);
      if (!newSlot || !newSlot.isAvailable) {
        return res.status(400).json({ message: "Selected time slot is not available" });
      }
      if (newSlot.serviceId !== booking.bookings.serviceId) {
        return res.status(400).json({ message: "Time slot must be for the same service" });
      }
      await storage.updateTimeSlot(booking.bookings.timeSlotId, { isAvailable: true });
      await storage.updateTimeSlot(newTimeSlotId, { isAvailable: false });
      const updatedBooking = await storage.updateBooking(req.params.id, {
        timeSlotId: newTimeSlotId,
        instructorId: newSlot.instructorId
      });
      res.json(updatedBooking);
    } catch (error) {
      logger.error("Error rescheduling booking:", { error: error.message });
      res.status(500).json({ message: "Failed to reschedule booking" });
    }
  });
  app2.post("/api/waitlist", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const waitlistData = insertWaitlistSchema.parse({
        ...req.body,
        clientId: userId
      });
      const waitlistEntry = await storage.addToWaitlist(waitlistData);
      res.json(waitlistEntry);
    } catch (error) {
      logger.error("Error adding to waitlist:", { error: error.message });
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });
  app2.get("/api/waitlist/:timeSlotId", async (req, res) => {
    try {
      const waitlist2 = await storage.getWaitlist(req.params.timeSlotId);
      res.json(waitlist2);
    } catch (error) {
      logger.error("Error fetching waitlist:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });
  app2.get("/api/availability/:instructorId", async (req, res) => {
    try {
      const availability2 = await storage.getInstructorAvailability(req.params.instructorId);
      res.json(availability2);
    } catch (error) {
      logger.error("Error fetching availability:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });
  app2.post("/api/availability", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const availabilityData = insertAvailabilitySchema.parse(req.body);
      const availability2 = await storage.createAvailability(availabilityData);
      res.json(availability2);
    } catch (error) {
      logger.error("Error creating availability:", { error: error.message });
      res.status(500).json({ message: "Failed to create availability" });
    }
  });
  app2.get("/api/analytics/bookings", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { startDate, endDate } = req.query;
      const stats = await storage.getBookingStats(
        startDate ? new Date(startDate) : void 0,
        endDate ? new Date(endDate) : void 0
      );
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching booking stats:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch booking stats" });
    }
  });
  app2.get("/api/class-templates", async (req, res) => {
    try {
      const templates = await storage.getClassTemplates();
      res.json(templates);
    } catch (error) {
      logger.error("Error fetching class templates:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch class templates" });
    }
  });
  app2.post("/api/class-templates", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isSuperuser) {
        return res.status(403).json({ message: "Only superusers can create custom templates" });
      }
      const validated = insertClassTemplateSchema.parse(req.body);
      const template = await storage.createClassTemplate({
        ...validated,
        createdBy: user.id
      });
      res.json(template);
    } catch (error) {
      logger.error("Error creating class template:", { error: error.message });
      res.status(500).json({ message: "Failed to create class template" });
    }
  });
  app2.get("/api/classes", async (req, res) => {
    try {
      const { type } = req.query;
      if (type === "upcoming") {
        const classes3 = await storage.getUpcomingClasses();
        return res.json(classes3);
      }
      if (type === "all") {
        const user = await storage.getUser(req.user?.id);
        if (!user || !isAdminOrSuperuser(user)) {
          return res.status(403).json({ message: "Admin access required" });
        }
        const classes3 = await storage.getAllClasses();
        return res.json(classes3);
      }
      const classes2 = await storage.getUpcomingClasses();
      return res.json(classes2);
    } catch (error) {
      logger.error("Error fetching classes:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.post("/api/classes/fix-counters", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      logger.info("Starting optimized class counter fix");
      const fixed = await storage.fixAllClassCounters();
      logger.info("Class counter fix completed", { fixedCount: fixed.length });
      res.json({ message: `Fixed ${fixed.length} classes`, fixed });
    } catch (error) {
      logger.error("Error fixing counters", { error: error.message });
      res.status(500).json({ message: "Failed to fix counters" });
    }
  });
  app2.get("/api/classes/:id", async (req, res) => {
    try {
      const classItem = await storage.getClass(req.params.id);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classItem);
    } catch (error) {
      logger.error("Error fetching class:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });
  app2.get("/api/classes/:id/registrations", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const registrationsList = await storage.getClassRegistrations(req.params.id);
      logger.debug("Fetched class registrations", {
        classId: req.params.id,
        registrationCount: registrationsList.length
      });
      res.json(registrationsList);
    } catch (error) {
      logger.error("Error fetching class registrations:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });
  app2.post("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const validated = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(validated);
      res.json(newClass);
    } catch (error) {
      logger.error("Error creating class:", { error: error.message });
      res.status(500).json({ message: "Failed to create class" });
    }
  });
  app2.delete("/api/classes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      logger.info("Deleting class", { classId: req.params.id });
      await storage.deleteClass(req.params.id);
      logger.info("Class deleted successfully", { classId: req.params.id });
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      logger.error("Error deleting class:", { error: error.message });
      res.status(500).json({ message: "Failed to delete class" });
    }
  });
  app2.get("/api/registrations/my", isAuthenticated, async (req, res) => {
    try {
      const registrations2 = await storage.getUserRegistrations(req.user.id);
      res.json(registrations2);
    } catch (error) {
      logger.error("Error fetching user registrations:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });
  app2.get("/api/registrations/class/:classId", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const registrations2 = await storage.getClassRegistrations(req.params.classId);
      res.json(registrations2);
    } catch (error) {
      logger.error("Error fetching class registrations:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });
  app2.post("/api/registrations/reserve", isAuthenticated, async (req, res) => {
    try {
      logger.debug("Reserve request received", { classId: req.body.classId });
      const { classId, paymentAmount } = req.body;
      if (!classId || !paymentAmount) {
        return res.status(400).json({ message: "Missing classId or paymentAmount" });
      }
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      if (classItem.currentBookings >= classItem.maxCapacity) {
        return res.status(400).json({ message: "Class is full" });
      }
      const paymentReference = `BW${Date.now().toString(36).toUpperCase()}`;
      const reservedUntil = /* @__PURE__ */ new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);
      const paymentDeadline = /* @__PURE__ */ new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);
      const registrationData = {
        classId,
        clientId: req.user.id,
        paymentAmount,
        paymentStatus: "pending",
        paymentMethod: "bank_transfer",
        paymentReference,
        paymentDeadline,
        reservedUntil,
        status: "reserved"
        // Temporary reservation
      };
      logger.debug("Creating reservation", { classId, paymentAmount });
      const registration = await storage.createRegistration(registrationData);
      logger.info("Reservation created", { registrationId: registration.id });
      res.json(registration);
    } catch (error) {
      logger.error("Error creating reservation:", { error: error.message });
      res.status(500).json({ message: "Failed to create reservation", error: String(error) });
    }
  });
  app2.patch("/api/registrations/:id/confirm", isAuthenticated, async (req, res) => {
    try {
      const registration = await storage.getRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      if (registration.clientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (registration.reservedUntil && /* @__PURE__ */ new Date() > new Date(registration.reservedUntil)) {
        return res.status(400).json({ message: "Reservation has expired" });
      }
      const updated = await storage.updateRegistration(req.params.id, {
        status: "confirmed",
        userConfirmedTransfer: true
      });
      try {
        const user = await storage.getUser(req.user.id);
        const classItem = await storage.getClass(registration.classId);
        const paymentInfoList = await storage.getActivePaymentInfo();
        const paymentInfo = paymentInfoList[0];
        if (user && classItem && paymentInfo) {
          await sendRegistrationConfirmation({
            registration: updated,
            classItem,
            user,
            paymentInfo: {
              companyName: paymentInfo.companyName,
              bankName: paymentInfo.bankName,
              accountNumber: paymentInfo.accountNumber,
              instructions: paymentInfo.instructions || ""
            }
          });
        }
      } catch (emailError) {
        logger.error("Failed to send confirmation email:", { error: emailError.message });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error confirming registration:", { error: error.message });
      res.status(500).json({ message: "Failed to confirm registration" });
    }
  });
  app2.post("/api/registrations", isAuthenticated, async (req, res) => {
    try {
      logger.debug("Registration request received", { userId: req.user?.id });
      const validated = insertRegistrationSchema.parse(req.body);
      const classItem = await storage.getClass(validated.classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      if (classItem.currentBookings >= classItem.maxCapacity) {
        return res.status(400).json({ message: "Class is full" });
      }
      const paymentReference = `BW${Date.now().toString(36).toUpperCase()}`;
      const paymentDeadline = /* @__PURE__ */ new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);
      const registrationData = {
        ...validated,
        clientId: req.user.id,
        paymentReference,
        paymentDeadline,
        status: "confirmed"
        // Spot is reserved immediately
      };
      logger.debug("Creating registration", { classId: validated.classId });
      const registration = await storage.createRegistration(registrationData);
      try {
        const user = await storage.getUser(req.user.id);
        const paymentInfoList = await storage.getActivePaymentInfo();
        const paymentInfo = paymentInfoList[0];
        if (user && paymentInfo) {
          await sendRegistrationConfirmation({
            registration,
            classItem,
            user,
            paymentInfo: {
              companyName: paymentInfo.companyName,
              bankName: paymentInfo.bankName,
              accountNumber: paymentInfo.accountNumber,
              instructions: paymentInfo.instructions || ""
            }
          });
        }
      } catch (emailError) {
        logger.error("Failed to send confirmation email:", { error: emailError.message });
      }
      res.json(registration);
    } catch (error) {
      logger.error("Error creating registration:", { error: error.message });
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });
  app2.patch("/api/registrations/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const registration = await storage.cancelRegistration(req.params.id);
      res.json(registration);
    } catch (error) {
      logger.error("Error cancelling registration:", { error: error.message });
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });
  app2.get("/api/registrations/:id", isAuthenticated, async (req, res) => {
    try {
      const registration = await storage.getRegistrationWithDetails(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      const user = await storage.getUser(req.user.id);
      if (registration.clientId !== req.user.id && !isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(registration);
    } catch (error) {
      logger.error("Error fetching registration:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch registration" });
    }
  });
  app2.patch("/api/registrations/:id/confirm-transfer", isAuthenticated, async (req, res) => {
    try {
      const registration = await storage.getRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      if (registration.clientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateRegistration(req.params.id, {
        userConfirmedTransfer: true
      });
      res.json(updated);
    } catch (error) {
      logger.error("Error confirming transfer:", { error: error.message });
      res.status(500).json({ message: "Failed to confirm transfer" });
    }
  });
  app2.patch("/api/registrations/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const updated = await storage.updateRegistration(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      logger.error("Error updating registration:", { error: error.message });
      res.status(500).json({ message: "Failed to update registration" });
    }
  });
  app2.delete("/api/registrations/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const registration = await storage.getRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      await storage.deleteRegistration(req.params.id);
      logger.info("Registration deleted by admin", {
        registrationId: req.params.id,
        classId: registration.classId,
        adminId: user.id
      });
      res.json({ message: "Registration deleted successfully" });
    } catch (error) {
      logger.error("Error deleting registration:", { error: error.message });
      res.status(500).json({ message: "Failed to delete registration" });
    }
  });
  app2.post("/api/invoices/customer", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoice = await storage.createCustomerInvoice({
        ...req.body,
        createdBy: user.id
      });
      res.json(invoice);
    } catch (error) {
      logger.error("Error creating customer invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  app2.get("/api/invoices/customer", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoices = await storage.getCustomerInvoices();
      res.json(invoices);
    } catch (error) {
      logger.error("Error fetching customer invoices:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/customer/my", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getCustomerInvoicesByClient(req.user.id);
      res.json(invoices);
    } catch (error) {
      logger.error("Error fetching customer invoices:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/customer/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getCustomerInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user) && invoice.clientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(invoice);
    } catch (error) {
      logger.error("Error fetching customer invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  app2.patch("/api/invoices/customer/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const updated = await storage.updateCustomerInvoice(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      logger.error("Error updating customer invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  app2.post("/api/invoices/company", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoice = await storage.createCompanyInvoice({
        ...req.body,
        uploadedBy: user.id
      });
      res.json(invoice);
    } catch (error) {
      logger.error("Error creating company invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  app2.get("/api/invoices/company", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoices = await storage.getCompanyInvoices();
      res.json(invoices);
    } catch (error) {
      logger.error("Error fetching company invoices:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/company/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const invoice = await storage.getCompanyInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      logger.error("Error fetching company invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  app2.patch("/api/invoices/company/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const updated = await storage.updateCompanyInvoice(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      logger.error("Error updating company invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/company/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteCompanyInvoice(req.params.id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      logger.error("Error deleting company invoice:", { error: error.message });
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });
  app2.get("/api/payment-info", async (req, res) => {
    try {
      const paymentInfo = await storage.getActivePaymentInfo();
      res.json(paymentInfo || []);
    } catch (error) {
      logger.error("Error fetching payment info:", { error: error.message });
      res.status(500).json({ message: "Failed to fetch payment information" });
    }
  });
  app2.post("/api/vouchers/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Voucher code is required" });
      }
      const result = await storage.validateVoucher(code);
      res.json(result);
    } catch (error) {
      logger.error("Error validating voucher:", { error: error.message });
      res.status(500).json({ message: "Failed to validate voucher" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets")
    }
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  console.log("\u{1F527} Setting up Vite development server...");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  console.log("\u2705 Vite middleware added");
  app2.use("*", async (req, res, next) => {
    console.log(`\u{1F310} Handling request: ${req.method} ${req.originalUrl}`);
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        process.cwd(),
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/middleware/errorHandler.ts
import { ZodError } from "zod";
var CustomError = class extends Error {
  statusCode;
  isOperational;
  code;
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
};
var ErrorTypes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
};
var createError = {
  validation: (message, details) => new CustomError(message, 400, ErrorTypes.VALIDATION_ERROR),
  authentication: (message = "Authentication required") => new CustomError(message, 401, ErrorTypes.AUTHENTICATION_ERROR),
  authorization: (message = "Insufficient permissions") => new CustomError(message, 403, ErrorTypes.AUTHORIZATION_ERROR),
  notFound: (resource = "Resource") => new CustomError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND),
  conflict: (message) => new CustomError(message, 409, ErrorTypes.CONFLICT),
  rateLimit: (message = "Too many requests") => new CustomError(message, 429, ErrorTypes.RATE_LIMIT_EXCEEDED),
  database: (message = "Database error") => new CustomError(message, 500, ErrorTypes.DATABASE_ERROR),
  external: (service, message) => new CustomError(message || `External service error: ${service}`, 502, ErrorTypes.EXTERNAL_SERVICE_ERROR),
  internal: (message = "Internal server error") => new CustomError(message, 500, ErrorTypes.INTERNAL_ERROR)
};
function formatErrorResponse(error, req) {
  const isDevelopment2 = process.env.NODE_ENV === "development";
  const response = {
    error: {
      message: error.message,
      code: error.code || "UNKNOWN_ERROR",
      statusCode: error.statusCode || 500
    }
  };
  if (isDevelopment2 && error.stack) {
    response.error.stack = error.stack;
  }
  if (req.headers["x-request-id"]) {
    response.error.requestId = req.headers["x-request-id"];
  }
  return response;
}
function errorHandler(error, req, res, next) {
  const logLevel = error.statusCode && error.statusCode < 500 ? "warn" : "error";
  logger[logLevel]("Request error", {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    requestId: req.headers["x-request-id"]
  });
  if (error instanceof ZodError) {
    const formattedError = createError.validation("Validation failed", error.errors);
    return res.status(400).json(formatErrorResponse(formattedError, req));
  }
  if (error.message.includes("Too many requests")) {
    const formattedError = createError.rateLimit(error.message);
    return res.status(429).json(formatErrorResponse(formattedError, req));
  }
  if (error.message.includes("database") || error.message.includes("connection")) {
    const formattedError = createError.database("Database operation failed");
    return res.status(500).json(formatErrorResponse(formattedError, req));
  }
  if (error.message.includes("jwt") || error.message.includes("token")) {
    const formattedError = createError.authentication("Invalid or expired token");
    return res.status(401).json(formatErrorResponse(formattedError, req));
  }
  const statusCode = error.statusCode || 500;
  const response = formatErrorResponse(error, req);
  res.status(statusCode).json(response);
}
function notFoundHandler(req, res, next) {
  const error = createError.notFound(`Route ${req.method} ${req.path}`);
  next(error);
}
function requestIdMiddleware(req, res, next) {
  const requestId = req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use(requestIdMiddleware);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  const port = parseInt(process.env.PORT || "5000", 10);
  console.log(`\u{1F527} Environment PORT: ${process.env.PORT}`);
  console.log(`\u{1F527} Using port: ${port}`);
  server.listen(port, () => {
    log(`serving on port ${port}`);
    log(`Frontend should be available at http://localhost:${port}`);
    log(`API health check: http://localhost:${port}/api/health`);
  });
})();
export {
  app
};
