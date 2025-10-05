import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { storage } from '../storage';
import { verifySession, type AuthRequest } from '../supabaseAuth';

// Helper to parse cookies in Vercel serverless functions
export function parseCookies(req: Request): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }

  return cookies;
}

// Auth middleware for Vercel serverless functions
export async function requireAuth(req: Request, res: Response): Promise<{ user: any } | null> {
  const cookies = parseCookies(req);
  const token = cookies['session_token'];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  try {
    const payload = verifySession(token);
    const user = await storage.getUser(payload.id);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return null;
    }

    return { user };
  } catch (error) {
    res.status(401).json({ message: "Invalid session" });
    return null;
  }
}

// Check if user is admin or superuser
export function isAdminOrSuperuser(user: any): boolean {
  return user?.role === 'admin' || user?.isSuperuser === true;
}

// CORS headers for Vercel
export function setCorsHeaders(res: Response) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

// Handle OPTIONS requests
export function handleOptions(res: Response) {
  setCorsHeaders(res);
  res.status(200).end();
}
