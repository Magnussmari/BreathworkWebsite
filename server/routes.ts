import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import {
  isAuthenticated,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  type AuthRequest
} from "./supabaseAuth";
import {
  insertServiceSchema,
  insertInstructorSchema,
  insertBookingSchema,
  insertAvailabilitySchema,
  insertTimeSlotSchema,
  insertWaitlistSchema,
  insertBlockedTimeSchema,
  insertVoucherSchema,
  insertClassTemplateSchema,
  insertClassSchema,
  insertRegistrationSchema,
  loginSchema,
  registerSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: 'client', // Default role
      });

      // Create session
      const token = createSession(user.id, user.email);

      // Set cookie
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const token = createSession(user.id, user.email);

      // Set cookie
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (token) {
        deleteSession(token);
      }
      res.clearCookie('session_token');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password hash to client
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Service routes
  app.get('/api/services', async (_req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Instructor routes
  app.get('/api/instructors', async (_req, res) => {
    try {
      const instructors = await storage.getActiveInstructors();
      res.json(instructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get('/api/instructors/:id', async (req, res) => {
    try {
      const instructor = await storage.getInstructor(req.params.id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      res.json(instructor);
    } catch (error) {
      console.error("Error fetching instructor:", error);
      res.status(500).json({ message: "Failed to fetch instructor" });
    }
  });

  // Time slots routes
  app.get('/api/time-slots/admin', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      const allTimeSlots = await storage.getUpcomingTimeSlots(start, end);
      res.json(allTimeSlots);
    } catch (error) {
      console.error("Error fetching admin time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.get('/api/time-slots', async (req, res) => {
    try {
      const { serviceId, startDate, endDate, includeUnavailable } = req.query;
      
      if (!serviceId || !startDate || !endDate) {
        return res.status(400).json({ message: "serviceId, startDate, and endDate are required" });
      }

      const timeSlots = await storage.getAvailableTimeSlots(
        serviceId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      // If includeUnavailable is true, also fetch unavailable slots
      if (includeUnavailable === 'true') {
        const allTimeSlots = await storage.getAllTimeSlots(
          serviceId as string,
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(allTimeSlots);
      } else {
        res.json(timeSlots);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.post('/api/time-slots', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin' && user?.role !== 'staff') {
        return res.status(403).json({ message: "Staff or admin access required" });
      }

      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      console.error("Error creating time slot:", error);
      res.status(500).json({ message: "Failed to create time slot" });
    }
  });

  app.delete('/api/time-slots/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin' && user?.role !== 'staff') {
        return res.status(403).json({ message: "Staff or admin access required" });
      }

      await storage.deleteTimeSlot(req.params.id);
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      res.status(500).json({ message: "Failed to delete time slot" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (user?.role === 'client') {
        const bookings = await storage.getUserBookings(user.id);
        res.json(bookings);
      } else if (user?.role === 'staff') {
        const instructor = await storage.getInstructorByUserId(user.id);
        if (!instructor) {
          return res.status(404).json({ message: "Instructor profile not found" });
        }
        const bookings = await storage.getInstructorBookings(instructor.instructors.id);
        res.json(bookings);
      } else if (user?.role === 'admin') {
        const bookings = await storage.getAllBookings();
        res.json(bookings);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(req.user!.id);
      
      // Check if user has access to this booking
      if (user?.role === 'client' && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (user?.role === 'staff') {
        const instructor = await storage.getInstructorByUserId(user.id);
        if (!instructor || booking.bookings.instructorId !== instructor.instructors.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        clientId: userId,
      });

      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(req.user!.id);
      
      // Check access rights
      if (user?.role === 'client' && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(req.params.id, updateData);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete('/api/bookings/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(req.user!.id);
      
      // Check access rights
      if (user?.role === 'client' && booking.bookings.clientId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const cancelledBooking = await storage.cancelBooking(req.params.id);
      
      // Check if there's anyone on the waitlist for this time slot
      const nextWaitlistUser = await storage.getNextWaitlistUser(booking.bookings.timeSlotId);
      
      // TODO: Implement email/SMS notification when spot opens (depends on task 3 & 8)
      // When email system is ready, send notification to nextWaitlistUser.users.email
      // and mark the waitlist entry as notified
      
      res.json({ 
        booking: cancelledBooking, 
        nextWaitlistUser: nextWaitlistUser ? {
          name: `${nextWaitlistUser.users.firstName} ${nextWaitlistUser.users.lastName}`,
          email: nextWaitlistUser.users.email,
          position: nextWaitlistUser.waitlist.position
        } : null
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Reschedule booking
  app.patch("/api/bookings/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const authenticatedUser = await storage.getUser(userId);
      
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { newTimeSlotId } = req.body;
      if (!newTimeSlotId) {
        return res.status(400).json({ message: "New time slot ID is required" });
      }

      // Get the booking
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions - only clients can reschedule their own bookings, staff/admin can reschedule any
      if (authenticatedUser.role === 'client' && booking.bookings.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check new slot availability
      const newSlot = await storage.getTimeSlot(newTimeSlotId);
      if (!newSlot || !newSlot.isAvailable) {
        return res.status(400).json({ message: "Selected time slot is not available" });
      }

      // Validate new slot matches the service
      if (newSlot.serviceId !== booking.bookings.serviceId) {
        return res.status(400).json({ message: "Time slot must be for the same service" });
      }

      // Free the old slot
      await storage.updateTimeSlot(booking.bookings.timeSlotId, { isAvailable: true });

      // Mark new slot as unavailable
      await storage.updateTimeSlot(newTimeSlotId, { isAvailable: false });

      // Update booking
      const updatedBooking = await storage.updateBooking(req.params.id, {
        timeSlotId: newTimeSlotId,
        instructorId: newSlot.instructorId,
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      res.status(500).json({ message: "Failed to reschedule booking" });
    }
  });

  // Waitlist routes
  app.post('/api/waitlist', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const waitlistData = insertWaitlistSchema.parse({
        ...req.body,
        clientId: userId,
      });

      const waitlistEntry = await storage.addToWaitlist(waitlistData);
      res.json(waitlistEntry);
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  app.get('/api/waitlist/:timeSlotId', async (req, res) => {
    try {
      const waitlist = await storage.getWaitlist(req.params.timeSlotId);
      res.json(waitlist);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  // Availability routes
  app.get('/api/availability/:instructorId', async (req, res) => {
    try {
      const availability = await storage.getInstructorAvailability(req.params.instructorId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/availability', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin' && user?.role !== 'staff') {
        return res.status(403).json({ message: "Staff or admin access required" });
      }

      const availabilityData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(availabilityData);
      res.json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/bookings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const stats = await storage.getBookingStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      res.status(500).json({ message: "Failed to fetch booking stats" });
    }
  });

  // NEW: Class template routes
  app.get('/api/class-templates', async (req, res) => {
    try {
      const templates = await storage.getClassTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching class templates:", error);
      res.status(500).json({ message: "Failed to fetch class templates" });
    }
  });

  app.post('/api/class-templates', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);

      // Only superusers can create custom templates
      if (!user?.isSuperuser) {
        return res.status(403).json({ message: "Only superusers can create custom templates" });
      }

      const validated = insertClassTemplateSchema.parse(req.body);
      const template = await storage.createClassTemplate({
        ...validated,
        createdBy: user.id,
      });

      res.json(template);
    } catch (error) {
      console.error("Error creating class template:", error);
      res.status(500).json({ message: "Failed to create class template" });
    }
  });

  // NEW: Class routes (public + admin)
  app.get('/api/classes/upcoming', async (req, res) => {
    try {
      const classes = await storage.getUpcomingClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      res.status(500).json({ message: "Failed to fetch upcoming classes" });
    }
  });

  app.get('/api/classes/:id', async (req, res) => {
    try {
      const classItem = await storage.getClass(req.params.id);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classItem);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  app.post('/api/classes', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validated = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(validated);

      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // NEW: Registration routes
  app.get('/api/registrations/my', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const registrations = await storage.getUserRegistrations(req.user!.id);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/registrations/class/:classId', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const registrations = await storage.getClassRegistrations(req.params.classId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching class registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post('/api/registrations', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      console.log('Registration request body:', req.body);
      console.log('User from session:', req.user);
      const validated = insertRegistrationSchema.parse(req.body);
      console.log('Validated data:', validated);

      // Check if class is full
      const classItem = await storage.getClass(validated.classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (classItem.currentBookings >= classItem.maxCapacity) {
        return res.status(400).json({ message: "Class is full" });
      }

      // Generate unique payment reference (booking number)
      const paymentReference = `BW${Date.now().toString(36).toUpperCase()}`;

      // Set payment deadline to 24 hours from now
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);

      const registrationData = {
        ...validated,
        clientId: req.user!.id,
        paymentReference,
        paymentDeadline,
        status: 'confirmed', // Spot is reserved immediately
      };
      console.log('Creating registration with data:', registrationData);

      const registration = await storage.createRegistration(registrationData);

      res.json(registration);
    } catch (error) {
      console.error("Error creating registration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.patch('/api/registrations/:id/cancel', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const registration = await storage.cancelRegistration(req.params.id);
      res.json(registration);
    } catch (error) {
      console.error("Error cancelling registration:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  });

  // Get single registration with details (for success page)
  app.get('/api/registrations/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const registration = await storage.getRegistrationWithDetails(req.params.id);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Verify ownership or admin
      const user = await storage.getUser(req.user!.id);
      if (registration.clientId !== req.user!.id && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({ message: "Failed to fetch registration" });
    }
  });

  // Confirm transfer (user clicked checkbox)
  app.patch('/api/registrations/:id/confirm-transfer', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const registration = await storage.getRegistration(req.params.id);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Verify ownership
      if (registration.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateRegistration(req.params.id, {
        userConfirmedTransfer: true,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error confirming transfer:", error);
      res.status(500).json({ message: "Failed to confirm transfer" });
    }
  });

  // Payment information routes
  app.get('/api/payment-info', async (req, res) => {
    try {
      const paymentInfo = await storage.getActivePaymentInfo();
      res.json(paymentInfo || []);
    } catch (error) {
      console.error("Error fetching payment info:", error);
      res.status(500).json({ message: "Failed to fetch payment information" });
    }
  });

  // Voucher routes
  app.post('/api/vouchers/validate', async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Voucher code is required" });
      }

      const result = await storage.validateVoucher(code);
      res.json(result);
    } catch (error) {
      console.error("Error validating voucher:", error);
      res.status(500).json({ message: "Failed to validate voucher" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
