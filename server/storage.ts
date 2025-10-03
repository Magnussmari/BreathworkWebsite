import {
  users,
  services,
  instructors,
  bookings,
  timeSlots,
  availability,
  waitlist,
  blockedTimes,
  vouchers,
  type User,
  type UpsertUser,
  type Service,
  type InsertService,
  type Instructor,
  type InsertInstructor,
  type Booking,
  type InsertBooking,
  type TimeSlot,
  type InsertTimeSlot,
  type Availability,
  type InsertAvailability,
  type Waitlist,
  type InsertWaitlist,
  type BlockedTime,
  type InsertBlockedTime,
  type Voucher,
  type InsertVoucher,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(id: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;

  // Service operations
  getServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Instructor operations
  getInstructors(): Promise<(Instructor & { user: User })[]>;
  getActiveInstructors(): Promise<(Instructor & { user: User })[]>;
  getInstructor(id: string): Promise<(Instructor & { user: User }) | undefined>;
  getInstructorByUserId(userId: string): Promise<(Instructor & { user: User }) | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: string, instructor: Partial<InsertInstructor>): Promise<Instructor>;

  // Availability operations
  getInstructorAvailability(instructorId: string): Promise<Availability[]>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: string, availability: Partial<InsertAvailability>): Promise<Availability>;
  deleteAvailability(id: string): Promise<void>;

  // Time slot operations
  getAvailableTimeSlots(serviceId: string, startDate: Date, endDate: Date): Promise<(TimeSlot & { instructor: Instructor & { user: User } })[]>;
  getAllTimeSlots(serviceId: string, startDate: Date, endDate: Date): Promise<(TimeSlot & { instructor: Instructor & { user: User } })[]>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot>;

  // Booking operations
  getUserBookings(userId: string): Promise<(Booking & { service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot })[]>;
  getInstructorBookings(instructorId: string, startDate?: Date, endDate?: Date): Promise<(Booking & { client: User; service: Service; timeSlot: TimeSlot })[]>;
  getAllBookings(startDate?: Date, endDate?: Date): Promise<(Booking & { client: User; service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot })[]>;
  getBooking(id: string): Promise<(Booking & { client: User; service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot }) | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  cancelBooking(id: string): Promise<Booking>;

  // Waitlist operations
  addToWaitlist(waitlistEntry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistPosition(clientId: string, timeSlotId: string): Promise<number | null>;
  getWaitlist(timeSlotId: string): Promise<(Waitlist & { client: User })[]>;
  removeFromWaitlist(id: string): Promise<void>;
  getNextWaitlistUser(timeSlotId: string): Promise<(Waitlist & { client: User }) | null>;

  // Blocked time operations
  getBlockedTimes(instructorId?: string, startDate?: Date, endDate?: Date): Promise<BlockedTime[]>;
  createBlockedTime(blockedTime: InsertBlockedTime): Promise<BlockedTime>;
  deleteBlockedTime(id: string): Promise<void>;

  // Voucher operations
  getVoucher(code: string): Promise<Voucher | undefined>;
  validateVoucher(code: string): Promise<{ valid: boolean; voucher?: Voucher; error?: string }>;
  useVoucher(code: string): Promise<Voucher>;

  // Analytics operations
  getBookingStats(startDate?: Date, endDate?: Date): Promise<{
    totalBookings: number;
    totalRevenue: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeInfo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(asc(services.name));
  }

  async getActiveServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.name));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Instructor operations
  async getInstructors(): Promise<(Instructor & { user: User })[]> {
    return await db
      .select()
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .orderBy(asc(users.firstName));
  }

  async getActiveInstructors(): Promise<(Instructor & { user: User })[]> {
    return await db
      .select()
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.isActive, true))
      .orderBy(asc(users.firstName));
  }

  async getInstructor(id: string): Promise<(Instructor & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.id, id));
    
    return result[0] || undefined;
  }

  async getInstructorByUserId(userId: string): Promise<(Instructor & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.userId, userId));
    
    return result[0] || undefined;
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    const [newInstructor] = await db.insert(instructors).values(instructor).returning();
    return newInstructor;
  }

  async updateInstructor(id: string, instructor: Partial<InsertInstructor>): Promise<Instructor> {
    const [updatedInstructor] = await db
      .update(instructors)
      .set({ ...instructor, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return updatedInstructor;
  }

  // Availability operations
  async getInstructorAvailability(instructorId: string): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(and(eq(availability.instructorId, instructorId), eq(availability.isActive, true)))
      .orderBy(asc(availability.dayOfWeek), asc(availability.startTime));
  }

  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const [newAvailability] = await db.insert(availability).values(availabilityData).returning();
    return newAvailability;
  }

  async updateAvailability(id: string, availabilityData: Partial<InsertAvailability>): Promise<Availability> {
    const [updatedAvailability] = await db
      .update(availability)
      .set(availabilityData)
      .where(eq(availability.id, id))
      .returning();
    return updatedAvailability;
  }

  async deleteAvailability(id: string): Promise<void> {
    await db.delete(availability).where(eq(availability.id, id));
  }

  // Time slot operations
  async getAvailableTimeSlots(serviceId: string, startDate: Date, endDate: Date): Promise<(TimeSlot & { instructor: Instructor & { user: User } })[]> {
    return await db
      .select()
      .from(timeSlots)
      .innerJoin(instructors, eq(timeSlots.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(
        and(
          eq(timeSlots.serviceId, serviceId),
          eq(timeSlots.isAvailable, true),
          gte(timeSlots.startTime, startDate),
          lte(timeSlots.startTime, endDate)
        )
      )
      .orderBy(asc(timeSlots.startTime));
  }

  async getAllTimeSlots(serviceId: string, startDate: Date, endDate: Date): Promise<(TimeSlot & { instructor: Instructor & { user: User } })[]> {
    return await db
      .select()
      .from(timeSlots)
      .innerJoin(instructors, eq(timeSlots.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(
        and(
          eq(timeSlots.serviceId, serviceId),
          gte(timeSlots.startTime, startDate),
          lte(timeSlots.startTime, endDate)
        )
      )
      .orderBy(asc(timeSlots.startTime));
  }

  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot;
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }

  async updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot> {
    const [updatedTimeSlot] = await db
      .update(timeSlots)
      .set(timeSlot)
      .where(eq(timeSlots.id, id))
      .returning();
    return updatedTimeSlot;
  }

  // Booking operations
  async getUserBookings(userId: string): Promise<(Booking & { service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot })[]> {
    return await db
      .select()
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(instructors, eq(bookings.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(eq(bookings.clientId, userId))
      .orderBy(desc(timeSlots.startTime));
  }

  async getInstructorBookings(instructorId: string, startDate?: Date, endDate?: Date): Promise<(Booking & { client: User; service: Service; timeSlot: TimeSlot })[]> {
    let conditions = [eq(bookings.instructorId, instructorId)];
    
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }

    return await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.clientId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(and(...conditions))
      .orderBy(asc(timeSlots.startTime));
  }

  async getAllBookings(startDate?: Date, endDate?: Date): Promise<(Booking & { client: User; service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot })[]> {
    let conditions = [];
    
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.clientId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(instructors, eq(bookings.instructorId, instructors.id))
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(whereClause)
      .orderBy(desc(timeSlots.startTime));
  }

  async getBooking(id: string): Promise<(Booking & { client: User; service: Service; instructor: Instructor & { user: User }; timeSlot: TimeSlot }) | undefined> {
    const result = await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.clientId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(instructors, eq(bookings.instructorId, instructors.id))
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(eq(bookings.id, id));

    return result[0] || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    
    // Mark time slot as unavailable if it's now full
    const service = await this.getService(booking.serviceId);
    if (service && service.maxCapacity === 1) {
      await this.updateTimeSlot(booking.timeSlotId, { isAvailable: false });
    }
    
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async cancelBooking(id: string): Promise<Booking> {
    const [cancelledBooking] = await db
      .update(bookings)
      .set({ 
        status: "cancelled",
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();

    // Make time slot available again
    await this.updateTimeSlot(cancelledBooking.timeSlotId, { isAvailable: true });
    
    return cancelledBooking;
  }

  // Waitlist operations
  async addToWaitlist(waitlistEntry: InsertWaitlist): Promise<Waitlist> {
    // Get current position
    const [maxPosition] = await db
      .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
      .from(waitlist)
      .where(eq(waitlist.timeSlotId, waitlistEntry.timeSlotId));
    
    const position = (maxPosition?.max || 0) + 1;
    
    const [newWaitlistEntry] = await db
      .insert(waitlist)
      .values({ ...waitlistEntry, position })
      .returning();
    
    return newWaitlistEntry;
  }

  async getWaitlistPosition(clientId: string, timeSlotId: string): Promise<number | null> {
    const [entry] = await db
      .select({ position: waitlist.position })
      .from(waitlist)
      .where(
        and(
          eq(waitlist.clientId, clientId),
          eq(waitlist.timeSlotId, timeSlotId),
          eq(waitlist.isActive, true)
        )
      );
    
    return entry?.position || null;
  }

  async getWaitlist(timeSlotId: string): Promise<(Waitlist & { client: User })[]> {
    return await db
      .select()
      .from(waitlist)
      .innerJoin(users, eq(waitlist.clientId, users.id))
      .where(and(eq(waitlist.timeSlotId, timeSlotId), eq(waitlist.isActive, true)))
      .orderBy(asc(waitlist.position));
  }

  async removeFromWaitlist(id: string): Promise<void> {
    await db
      .update(waitlist)
      .set({ isActive: false })
      .where(eq(waitlist.id, id));
  }

  async getNextWaitlistUser(timeSlotId: string): Promise<(Waitlist & { client: User }) | null> {
    const results = await db
      .select()
      .from(waitlist)
      .innerJoin(users, eq(waitlist.clientId, users.id))
      .where(and(eq(waitlist.timeSlotId, timeSlotId), eq(waitlist.isActive, true)))
      .orderBy(asc(waitlist.position))
      .limit(1);
    
    return results[0] || null;
  }

  // Blocked time operations
  async getBlockedTimes(instructorId?: string, startDate?: Date, endDate?: Date): Promise<BlockedTime[]> {
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(blockedTimes)
      .where(whereClause)
      .orderBy(asc(blockedTimes.startTime));
  }

  async createBlockedTime(blockedTime: InsertBlockedTime): Promise<BlockedTime> {
    const [newBlockedTime] = await db.insert(blockedTimes).values(blockedTime).returning();
    return newBlockedTime;
  }

  async deleteBlockedTime(id: string): Promise<void> {
    await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
  }

  // Voucher operations
  async getVoucher(code: string): Promise<Voucher | undefined> {
    const [voucher] = await db.select().from(vouchers).where(eq(vouchers.code, code));
    return voucher;
  }

  async validateVoucher(code: string): Promise<{ valid: boolean; voucher?: Voucher; error?: string }> {
    const voucher = await this.getVoucher(code);
    
    if (!voucher) {
      return { valid: false, error: "Voucher not found" };
    }
    
    if (!voucher.isActive) {
      return { valid: false, error: "Voucher is no longer active" };
    }
    
    if (voucher.validUntil && new Date() > voucher.validUntil) {
      return { valid: false, error: "Voucher has expired" };
    }
    
    if (voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, error: "Voucher usage limit reached" };
    }
    
    return { valid: true, voucher };
  }

  async useVoucher(code: string): Promise<Voucher> {
    const [updatedVoucher] = await db
      .update(vouchers)
      .set({ 
        usedCount: sql`${vouchers.usedCount} + 1`
      })
      .where(eq(vouchers.code, code))
      .returning();
    
    return updatedVoucher;
  }

  // Analytics operations
  async getBookingStats(startDate?: Date, endDate?: Date): Promise<{
    totalBookings: number;
    totalRevenue: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  }> {
    let conditions = [];
    
    if (startDate) {
      conditions.push(gte(timeSlots.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(timeSlots.startTime, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const stats = await db
      .select({
        totalBookings: count(),
        totalRevenue: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
        pendingBookings: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'pending' THEN 1 END)`,
        completedBookings: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'completed' THEN 1 END)`,
        cancelledBookings: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 END)`,
      })
      .from(bookings)
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .where(whereClause);

    return stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
    };
  }
}

export const storage = new DatabaseStorage();
