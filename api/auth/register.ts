import type { Request, Response } from 'express';
import { storage } from '../../server/storage';
import { hashPassword, createSession } from '../../server/supabaseAuth';
import { registerSchema } from '@shared/schema';
import { z } from 'zod';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    res.setHeader('Set-Cookie', `session_token=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    res.status(500).json({ message: "Registration failed" });
  }
}
