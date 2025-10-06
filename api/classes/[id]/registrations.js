export default async function handler(req, res) {
  try {
    const { storage } = await import('../../../dist/storage.js');
    const { verifySession } = await import('../../../dist/supabaseAuth.js');
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Helper to parse cookies
    const parseCookies = () => {
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
      return cookies;
    };

    if (req.method === 'GET') {
      // Authenticate user
      const cookies = parseCookies();
      const token = cookies['session_token'];

      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payload = verifySession(token);
      const user = await storage.getUser(payload.id);

      const isAdminOrSuperuser = user?.role === 'admin' || user?.isSuperuser;

      if (!isAdminOrSuperuser) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const registrations = await storage.getClassRegistrations(id);
      return res.json(registrations);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Class registrations error:", error);
    return res.status(500).json({
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
}
