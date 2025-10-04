import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';

// Simple in-memory session store (replace with Redis in production)
const sessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

// Generate a session token
function generateSessionToken(): string {
  return crypto.randomUUID();
}

// Cleanup expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}, 60000); // Run every minute

// Authentication middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function isAuthenticated(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check for session token in cookies or Authorization header
    const token = req.cookies?.session_token ||
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Check if session exists and is valid
    const session = sessions.get(token);
    if (!session) {
      res.status(401).json({ message: 'Invalid session' });
      return;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      res.status(401).json({ message: 'Session expired' });
      return;
    }

    // Get user from database
    const user = await storage.getUser(session.userId);
    if (!user) {
      sessions.delete(token);
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create session
export function createSession(userId: string, email: string): string {
  const token = generateSessionToken();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

  sessions.set(token, {
    userId,
    email,
    expiresAt,
  });

  return token;
}

// Delete session
export function deleteSession(token: string): void {
  sessions.delete(token);
}

// Get session
export function getSession(token: string) {
  return sessions.get(token);
}
