#!/usr/bin/env node

/**
 * Setup script for Breathwork app
 * - Sets maggismari@gmail.com as superuser
 * - Creates 9D Breathwork default template
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

async function setup() {
  console.log('🚀 Setting up Breathwork...\n');

  try {
    // 1. Set maggismari as superuser
    console.log('1️⃣  Setting maggismari@gmail.com as superuser...');
    const [updatedUser] = await db
      .update(schema.users)
      .set({ isSuperuser: true })
      .where(eq(schema.users.email, 'maggismari@gmail.com'))
      .returning();

    if (updatedUser) {
      console.log(`✅ ${updatedUser.email} is now a superuser\n`);
    } else {
      console.log('⚠️  User maggismari@gmail.com not found\n');
    }

    // 2. Create 9D Breathwork default template
    console.log('2️⃣  Creating 9D Breathwork default template...');

    // Check if default template exists
    const existingTemplate = await db.query.classTemplates.findFirst({
      where: eq(schema.classTemplates.isDefault, true),
    });

    if (existingTemplate) {
      console.log(`✅ Default template already exists: ${existingTemplate.name}\n`);
    } else {
      const [template] = await db.insert(schema.classTemplates).values({
        name: '9D Breathwork Session',
        description: 'Experience the transformative power of 9D breathwork. This immersive journey combines conscious connected breathing with multi-dimensional soundscapes, guided visualization, and somatic therapy techniques to release emotional blockages, reduce stress, and unlock profound healing.\n\nWhat is 9D Breathwork?\n\n9D Breathwork is a revolutionary approach that layers nine elements:\n\n1. Breathwork (conscious connected breathing)\n2. Somatic therapy\n3. Subliminal hypnotherapy\n4. Guided coaching\n5. Solfeggio frequencies\n6. 432hz harmonic tuning\n7. Binaural brain entrainment\n8. Isochronic brainwave tones\n9. Spatial sound\n\nSuitable for all levels - no prior experience needed. Please arrive 15 minutes early.',
        duration: 90, // 90 minutes
        price: 7900, // 7,900 ISK
        maxCapacity: 15,
        isDefault: true,
        isActive: true,
        createdBy: null, // System default
      }).returning();

      console.log(`✅ Created default template: ${template.name}`);
      console.log(`   Duration: ${template.duration} minutes`);
      console.log(`   Price: ${template.price} ISK`);
      console.log(`   Max Capacity: ${template.maxCapacity} people\n`);
    }

    console.log('🎉 Setup complete!\n');

    console.log('Next steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Login as admin: maggismari@gmail.com');
    console.log('3. Go to Admin Dashboard to create your first class\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
