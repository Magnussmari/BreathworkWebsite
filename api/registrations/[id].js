export default async function handler(req, res) {
  try {
    const { storage } = await import('../../dist/storage.js');
    const { verifySession } = await import('../../dist/supabaseAuth.js');
    const { sendRegistrationConfirmation } = await import('../../dist/email.js');
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
      // GET /api/registrations/:id
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
      const { action } = req.query; // Use query param to determine action

      // Get registration first
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Handle different PATCH actions based on query parameter
      if (action === 'confirm') {
        // PATCH /api/registrations/:id?action=confirm - Step 2: Confirm after reserve
        if (registration.clientId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (registration.status !== 'reserved') {
          return res.status(400).json({ message: "Can only confirm reserved registrations" });
        }

        const updated = await storage.updateRegistration(id, {
          status: 'confirmed',
        });

        // Send confirmation email
        const classItem = await storage.getClass(registration.classId);
        if (classItem) {
          await sendRegistrationConfirmation({
            to: user.email,
            userName: user.firstName || user.email,
            className: classItem.template.name,
            classDate: classItem.scheduledDate,
            classLocation: classItem.location,
            paymentAmount: registration.paymentAmount,
            paymentReference: registration.paymentReference,
          });
        }

        return res.json(updated);
      }

      if (action === 'confirm-transfer') {
        // PATCH /api/registrations/:id?action=confirm-transfer - User confirms bank transfer
        if (registration.clientId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updated = await storage.updateRegistration(id, {
          userConfirmedTransfer: true,
        });

        return res.json(updated);
      }

      if (action === 'cancel') {
        // PATCH /api/registrations/:id?action=cancel - Cancel registration
        if (registration.clientId !== user.id && !isAdminOrSuperuser) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updated = await storage.updateRegistration(id, {
          status: 'cancelled',
        });

        return res.json(updated);
      }

      // Default PATCH (admin update)
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
