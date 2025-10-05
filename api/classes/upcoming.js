module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamic import for ESM modules
    const { storage } = await import('../../dist/storage.js');

    const classes = await storage.getUpcomingClasses();
    res.json(classes);
  } catch (error) {
    console.error("Error fetching upcoming classes:", error);
    res.status(500).json({ message: "Failed to fetch upcoming classes" });
  }
};
