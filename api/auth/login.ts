import type { Request, Response } from 'express';
import { storage } from '../../server/storage';
import { verifyPassword, createSession } from '../../server/supabaseAuth';
import { loginSchema } from '@shared/schema';
import { z } from 'zod';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    res.status(500).json({ message: "Login failed" });
  }
}
