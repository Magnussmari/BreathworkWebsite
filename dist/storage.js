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
      role: varchar("role", { enum: ["client", "admin"] }).default("client").notNull(),
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
    if (voucher.usedCount >= voucher.usageLimit) {
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
export {
  DatabaseStorage,
  storage
};
