import { db } from "./db";
import { users, services, instructors, availability, timeSlots } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const [adminUser] = await db.insert(users).values({
    id: "admin-001",
    email: "admin@nordicbreath.is",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
  }).onConflictDoUpdate({
    target: users.id,
    set: { role: "admin" }
  }).returning();
  console.log("✓ Admin user created:", adminUser.email);

  // Create client user for testing
  const [clientUser] = await db.insert(users).values({
    id: "client-001",
    email: "test@example.is",
    firstName: "Test",
    lastName: "Client",
    role: "client",
  }).onConflictDoUpdate({
    target: users.id,
    set: { role: "client" }
  }).returning();
  console.log("✓ Client user created:", clientUser.email);

  // Create staff users
  const [staff1] = await db.insert(users).values({
    id: "staff-001",
    email: "sigridur@nordicbreath.is",
    firstName: "Sigríður",
    lastName: "Jónsdóttir",
    role: "staff",
  }).onConflictDoUpdate({
    target: users.id,
    set: { role: "staff" }
  }).returning();

  const [staff2] = await db.insert(users).values({
    id: "staff-002",
    email: "bjorn@nordicbreath.is",
    firstName: "Björn",
    lastName: "Ólafsson",
    role: "staff",
  }).onConflictDoUpdate({
    target: users.id,
    set: { role: "staff" }
  }).returning();
  console.log("✓ Staff users created");

  // Check if instructors exist, if not create them
  let instructor1 = (await db.select().from(instructors).where(eq(instructors.userId, staff1.id)))[0];
  let instructor2 = (await db.select().from(instructors).where(eq(instructors.userId, staff2.id)))[0];

  if (!instructor1) {
    [instructor1] = await db.insert(instructors).values({
      userId: staff1.id,
      bio: "Certified breathwork facilitator with 8 years of experience in Conscious Connected Breathing and holotropic breathwork. Passionate about helping people release trauma and unlock their full potential.",
      specializations: ["Holotropic Breathwork", "Trauma Release", "Stress Management"],
      certifications: ["CBF Certified", "Trauma-Informed Practice", "First Aid & CPR"],
      experience: "8 years professional practice",
    }).returning();
  }

  if (!instructor2) {
    [instructor2] = await db.insert(instructors).values({
      userId: staff2.id,
      bio: "Expert in Wim Hof Method and cold exposure therapy. Former athlete turned breathwork practitioner, specializing in performance optimization and mental resilience.",
      specializations: ["Wim Hof Method", "Performance Optimization", "Cold Therapy"],
      certifications: ["Wim Hof Certified", "Sports Psychology", "Advanced Breathwork"],
      experience: "6 years professional practice",
    }).returning();
  }
  console.log("✓ Instructors created/updated");

  // Create services
  const serviceData = [
    {
      name: "Introduction to Breathwork",
      description: "Perfect for beginners. Learn fundamental breathing techniques to reduce stress and enhance wellbeing. 60-minute session includes guided practice and Q&A.",
      duration: 60,
      price: "4500",
      maxCapacity: 8,
      category: "beginner",
      prerequisites: "None - suitable for complete beginners",
    },
    {
      name: "Deep Healing Breathwork",
      description: "Transformative 90-minute journey using conscious connected breathing to release emotional blockages and restore balance. Experience profound healing in a safe, supported environment.",
      duration: 90,
      price: "7900",
      maxCapacity: 6,
      category: "popular",
      prerequisites: "At least one previous breathwork session recommended",
    },
    {
      name: "Private One-on-One Session",
      description: "Personalized breathwork session tailored to your specific needs. Includes health assessment, custom technique selection, and post-session integration guidance.",
      duration: 90,
      price: "12500",
      maxCapacity: 1,
      category: "premium",
      prerequisites: "Initial consultation required",
    },
    {
      name: "Weekend Breathwork Retreat",
      description: "Immersive two-day retreat combining multiple breathwork sessions, meditation, cold exposure, and integration circles. Deep transformation in Iceland's stunning nature.",
      duration: 480,
      price: "45000",
      maxCapacity: 12,
      category: "advanced",
      prerequisites: "Previous breathwork experience required",
    },
  ];

  // Check if services exist, if not create them
  const allServices = [];
  for (const service of serviceData) {
    let existingService = (await db.select().from(services).where(eq(services.name, service.name)))[0];
    if (!existingService) {
      [existingService] = await db.insert(services).values(service).returning();
    }
    allServices.push(existingService);
  }
  console.log(`✓ ${allServices.length} services created/updated`);

  // Create availability for instructors (Monday to Friday, 9 AM to 5 PM)
  const availabilityData = [];
  for (let day = 1; day <= 5; day++) { // Monday to Friday
    if (instructor1) {
      availabilityData.push({
        instructorId: instructor1.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
    if (instructor2) {
      availabilityData.push({
        instructorId: instructor2.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
      });
    }
  }

  await db.insert(availability).values(availabilityData).onConflictDoNothing();
  console.log("✓ Instructor availability set");

  // Create time slots for the next 7 days
  const timeSlotsData = [];
  const today = new Date();
  
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Create time slots for each service and instructor
    for (const service of allServices) {
      const hours = [9, 11, 14, 16]; // 9 AM, 11 AM, 2 PM, 4 PM
      
      for (const hour of hours) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration);
        
        // Create slots for both instructors
        if (instructor1 && hour >= 9 && hour < 17) {
          timeSlotsData.push({
            instructorId: instructor1.id,
            serviceId: service.id,
            startTime,
            endTime,
            isAvailable: true,
          });
        }
        
        if (instructor2 && hour >= 10 && hour < 18) {
          timeSlotsData.push({
            instructorId: instructor2.id,
            serviceId: service.id,
            startTime,
            endTime,
            isAvailable: true,
          });
        }
      }
    }
  }

  if (timeSlotsData.length > 0) {
    const createdSlots = await db.insert(timeSlots).values(timeSlotsData).onConflictDoNothing().returning();
    console.log(`✓ ${createdSlots.length} time slots created for the next 7 days`);
  }

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("Admin: admin@nordicbreath.is");
  console.log("Staff 1: sigridur@nordicbreath.is");
  console.log("Staff 2: bjorn@nordicbreath.is");
  console.log("Client: test@example.is");
  console.log("\nNote: Use Replit Auth to log in with any of these users");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
