export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { storage } = await import('../../dist/storage.js');

    const instructors = await storage.getActiveInstructors();
    res.json(instructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Failed to fetch instructors" });
  }
}
