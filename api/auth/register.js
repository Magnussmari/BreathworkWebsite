export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamic import for ESM modules
    const { storage } = await import('../../dist/storage.js');
    const { hashPassword, createSession } = await import('../../dist/supabaseAuth.js');

    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

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
    res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
}
