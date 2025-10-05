export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamic import for ESM modules
    const { storage } = await import('../../dist/storage.js');
    const { verifyPassword, createSession } = await import('../../dist/supabaseAuth.js');

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

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
    res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}
