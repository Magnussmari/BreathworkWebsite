#!/usr/bin/env node

/**
 * Create a test 9D Breathwork class for development
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import * as schema from './shared/schema.ts';
import { eq } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function createTestClass() {
  console.log('🎨 Creating test 9D Breathwork class...\n');

  try {
    // Get the default 9D template
    const template = await db.query.classTemplates.findFirst({
      where: eq(schema.classTemplates.isDefault, true),
    });

    if (!template) {
      console.log('❌ No default template found. Run setup-breathwork.js first!');
      process.exit(1);
    }

    // Create a class for next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(18, 0, 0, 0); // 6 PM

    const [newClass] = await db.insert(schema.classes).values({
      templateId: template.id,
      scheduledDate: nextWeek,
      location: 'Reykjavík Wellness Studio, Laugavegur 45',
      maxCapacity: 15,
      currentBookings: 0,
      status: 'upcoming',
      instructorNotes: 'Remember to bring yoga mats and water',
    }).returning();

    console.log('✅ Test class created!');
    console.log(`   Template: ${template.name}`);
    console.log(`   Date: ${nextWeek.toLocaleDateString('is-IS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`   Time: ${nextWeek.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}`);
    console.log(`   Location: ${newClass.location}`);
    console.log(`   Capacity: ${newClass.maxCapacity} people`);
    console.log(`   Price: ${template.price} ISK\n`);

    console.log('🎉 Ready to test! Visit http://localhost:3000 to see it.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestClass();
