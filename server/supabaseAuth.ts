import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Get JWT secret from environment
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

const JWT_EXPIRES_IN = '7d'; // 7 days

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
}

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

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Session expired' });
      } else {
        res.status(401).json({ message: 'Invalid session' });
      }
      return;
    }

    // Get user from database to ensure they still exist
    const user = await storage.getUser(decoded.userId);
    if (!user) {
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

// Create session - now returns JWT token
export function createSession(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Delete session - JWT is stateless, so we just invalidate on client side
export function deleteSession(_token: string): void {
  // With JWT, we can't invalidate server-side without a blacklist
  // The client should remove the cookie/token
  // For true invalidation, you'd need a token blacklist in Redis/DB
}

// Get session - verify and return decoded token
export function getSession(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Verify session - returns decoded payload with { id } instead of { userId }
export function verifySession(token: string): { id: string; email: string } {
  const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
  return {
    id: decoded.userId,
    email: decoded.email,
  };
}
