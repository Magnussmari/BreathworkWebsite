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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clients see their own bookings, admins see all
    if (user.role === 'client') {
      const bookings = await storage.getUserBookings(user.id);
      return res.json(bookings);
    } else if (user.role === 'admin') {
      const bookings = await storage.getAllBookings();
      return res.json(bookings);
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
}
