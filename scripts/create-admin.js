import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function createAdminUser() {
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash the password
    const passwordHash = await bcrypt.hash('password1234', 10);
    console.log('✅ Password hashed');

    // Check if user already exists
    const checkResult = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['maggismari@gmail.com']
    );

    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      console.log('⚠️  User already exists:', user);

      // Update to admin if not already
      if (user.role !== 'admin') {
        await client.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['admin', 'maggismari@gmail.com']
        );
        console.log('✅ Updated user role to admin');
      }
    } else {
      // Create new admin user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role`,
        ['maggismari@gmail.com', passwordHash, 'Magnus', 'Smári', 'admin']
      );

      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Role:', result.rows[0].role);
      console.log('🆔 ID:', result.rows[0].id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done!');
  }
}

createAdminUser();
