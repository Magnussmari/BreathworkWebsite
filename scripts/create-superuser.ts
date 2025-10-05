import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/supabaseAuth';

async function createSuperuser() {
  try {
    const email = 'maggismari@gmail.com';
    const password = 'Breath2025!';

    // Check if user exists
    const [existing] = await db.select().from(users).where(eq(users.email, email));

    if (existing) {
      // Update existing user
      const passwordHash = await hashPassword(password);
      await db.update(users)
        .set({ 
          passwordHash,
          role: 'admin',
          isSuperuser: true 
        })
        .where(eq(users.email, email));
      
      console.log(`✓ Updated superuser: ${email}`);
      console.log(`  Password reset to: ${password}`);
    } else {
      // Create new superuser
      const passwordHash = await hashPassword(password);
      const [user] = await db.insert(users).values({
        email,
        passwordHash,
        firstName: 'Magnus',
        lastName: 'Smári',
        role: 'admin',
        isSuperuser: true
      }).returning();

      console.log(`✓ Created superuser: ${email}`);
      console.log(`  Password: ${password}`);
      console.log(`  User ID: ${user.id}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

createSuperuser();
