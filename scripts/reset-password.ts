import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/supabaseAuth';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetPassword() {
  try {
    const email = await question('Enter email address: ');
    const newPassword = await question('Enter new password: ');

    if (!email || !newPassword) {
      console.error('Email and password are required');
      process.exit(1);
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.email, email));

    console.log(`✓ Password reset successfully for ${email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Superuser: ${user.isSuperuser ? 'Yes' : 'No'}`);

    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetPassword();
