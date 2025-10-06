export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');
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

      if (!user || (user.role !== 'admin' && !user.isSuperuser)) {
        throw new Error('Admin access required');
      }

      return user;
    };

    if (req.method === 'GET') {
      // GET /api/classes/:id - Public route to get specific class
      const classItem = await storage.getClass(id);

      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      return res.json(classItem);
    }

    if (req.method === 'DELETE') {
      // DELETE /api/classes/:id - Admin only
      await authenticateAdmin();

      console.log(`[delete-class] Deleting class ${id}`);
      await storage.deleteClass(id);
      console.log(`[delete-class] Successfully deleted class ${id}`);

      return res.json({ message: "Class deleted successfully" });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Class ID error:", error);
    console.error("Error stack:", error.stack);

    if (error.message === 'Unauthorized') {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (error.message === 'Admin access required') {
      return res.status(403).json({ message: "Admin access required" });
    }

    return res.status(500).json({
      message: "Failed to process class request",
      error: error.message,
    });
  }
}
