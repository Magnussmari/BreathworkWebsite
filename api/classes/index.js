export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');

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

    // Helper to authenticate admin
    const authenticateAdmin = async () => {
      const { verifySession } = await import('../../dist/supabaseAuth.js');
      const cookies = parseCookies();
      const token = cookies['session_token'];

      if (!token) {
        throw new Error('Unauthorized');
      }

      const payload = verifySession(token);
      const user = await storage.getUser(payload.id);

      if (!user || user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return user;
    };

    if (req.method === 'GET') {
      const { type } = req.query;

      // GET /api/classes?type=upcoming - Public upcoming classes
      if (type === 'upcoming') {
        const classes = await storage.getUpcomingClasses();
        return res.json(classes);
      }

      // GET /api/classes?type=all - Admin all classes
      if (type === 'all') {
        await authenticateAdmin();
        const classes = await storage.getAllClasses();
        return res.json(classes);
      }

      // Default: upcoming classes
      const classes = await storage.getUpcomingClasses();
      return res.json(classes);
    }

    if (req.method === 'POST') {
      // POST /api/classes - Create new class (admin only)
      await authenticateAdmin();

      // Validate and transform the request body
      const { insertClassSchema } = await import('../../dist/index.js');
      const validated = insertClassSchema.parse(req.body);

      const newClass = await storage.createClass(validated);
      return res.json(newClass);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Classes error:", error);

    if (error.message === 'Unauthorized') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (error.message === 'Admin access required') {
      return res.status(403).json({ message: "Admin access required" });
    }

    return res.status(500).json({ message: "Failed to process classes request" });
  }
}
