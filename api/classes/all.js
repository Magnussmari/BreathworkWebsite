export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { storage } = await import('../../dist/storage.js');
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

    const classes = await storage.getAllClasses();
    res.json(classes);
  } catch (error) {
    console.error("Error fetching all classes:", error);
    res.status(500).json({ message: "Failed to fetch all classes" });
  }
}
