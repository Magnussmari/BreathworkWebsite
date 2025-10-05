import type { Request, Response } from 'express';
import { requireAuth } from '../../server/lib/vercel-helpers';
import { storage } from '../../server/storage';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return; // Response already sent by requireAuth

    const user = await storage.getUser(auth.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send password hash to client
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}
