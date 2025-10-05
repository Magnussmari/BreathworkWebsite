import type { Request, Response } from 'express';
import { storage } from '../../server/storage';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const classes = await storage.getUpcomingClasses();
    res.json(classes);
  } catch (error) {
    console.error("Error fetching upcoming classes:", error);
    res.status(500).json({ message: "Failed to fetch upcoming classes" });
  }
}
