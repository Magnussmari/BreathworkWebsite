export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');
    const { verifySession } = await import('../../dist/supabaseAuth.js');

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

    // Authenticate user
    const cookies = parseCookies();
    const token = cookies['session_token'];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifySession(token);
    const user = await storage.getUser(payload.id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === 'POST') {
      console.log('Reserve request body:', req.body);
      const { classId, paymentAmount } = req.body;

      if (!classId || !paymentAmount) {
        return res.status(400).json({ message: "Missing classId or paymentAmount" });
      }

      // Check if class exists and has space
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (classItem.currentBookings >= classItem.maxCapacity) {
        return res.status(400).json({ message: "Class is full" });
      }

      // Generate unique payment reference
      const paymentReference = `BW${Date.now().toString(36).toUpperCase()}`;

      // Set reservation deadline (10 minutes)
      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);

      // Set payment deadline (24 hours)
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);

      const registrationData = {
        classId,
        clientId: user.id,
        paymentAmount,
        paymentStatus: 'pending',
        paymentMethod: 'bank_transfer',
        paymentReference,
        paymentDeadline,
        reservedUntil,
        status: 'reserved',
      };

      console.log('Creating reservation with data:', registrationData);
      const registration = await storage.createRegistration(registrationData);
      console.log('Created registration:', registration);

      return res.json(registration);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Reserve error:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      message: "Failed to create reservation",
      error: error.message,
    });
  }
}
