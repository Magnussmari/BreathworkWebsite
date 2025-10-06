export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');
    const { verifySession } = await import('../../dist/supabaseAuth.js');
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Registration ID is required" });
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

    const isAdminOrSuperuser = user.role === 'admin' || user.isSuperuser;

    if (req.method === 'GET') {
      // GET /api/registrations/:id - Get registration details
      const registration = await storage.getRegistrationWithDetails(id);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Verify ownership or admin
      if (registration.clientId !== user.id && !isAdminOrSuperuser) {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.json(registration);
    }

    if (req.method === 'PATCH') {
      // Get registration first for all PATCH operations
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Check action in request body or query param
      const action = req.body.action || req.query.action;

      if (action === 'confirm') {
        // PATCH /api/registrations/:id with action=confirm - Confirm reservation
        if (registration.clientId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (registration.status !== 'reserved') {
          return res.status(400).json({ message: "Can only confirm reserved registrations" });
        }

        const updated = await storage.updateRegistration(id, {
          status: 'confirmed',
        });

        return res.json(updated);
      }

      if (action === 'confirm-transfer') {
        // PATCH /api/registrations/:id with action=confirm-transfer - User confirms bank transfer
        if (registration.clientId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updated = await storage.updateRegistration(id, {
          userConfirmedTransfer: true,
        });

        return res.json(updated);
      }

      if (action === 'cancel') {
        // PATCH /api/registrations/:id with action=cancel - Cancel registration
        if (registration.clientId !== user.id && !isAdminOrSuperuser) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updated = await storage.updateRegistration(id, {
          status: 'cancelled',
        });

        return res.json(updated);
      }

      // Default PATCH (admin update, no action specified)
      if (!isAdminOrSuperuser) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updated = await storage.updateRegistration(id, req.body);
      return res.json(updated);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Registration ID error:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      message: "Failed to process registration request",
      error: error.message,
    });
  }
}
