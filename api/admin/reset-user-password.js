export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamic import for ESM modules
    const { storage } = await import('../../dist/storage.js');
    const { verifySession, hashPassword } = await import('../../dist/supabaseAuth.js');

    // Parse cookies
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }

    const token = cookies['session_token'];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifySession(token);
    const adminUser = await storage.getUser(payload.id);

    // Check if user is admin or superuser
    if (!adminUser || (adminUser.role !== 'admin' && !adminUser.isSuperuser)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: "User ID and new password required" });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await storage.updateUser(userId, { passwordHash });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
}
