export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');

    if (req.method === 'POST') {
      // Create new class (admin only)
      const { verifySession } = await import('../../dist/supabaseAuth.js');

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
      const user = await storage.getUser(payload.id);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const newClass = await storage.createClass(req.body);
      return res.json(newClass);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Classes error:", error);
    return res.status(500).json({ message: "Failed to process classes request" });
  }
}
