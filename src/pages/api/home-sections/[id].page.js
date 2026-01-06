import prisma from '@src/lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const section = await prisma.homeSections.findUnique({
        where: { id },
      });

      if (!section) {
        return res.status(404).json({ error: 'Home section not found' });
      }

      return res.status(200).json(section);
    } catch (error) {
      console.error('Error fetching home section:', error);
      return res.status(500).json({ error: 'Failed to fetch home section' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { judul, gambar, urutan } = req.body;

      if (!judul || !gambar || !Array.isArray(gambar)) {
        return res.status(400).json({ error: 'Judul dan gambar harus diisi' });
      }

      const section = await prisma.homeSections.update({
        where: { id },
        data: {
          judul,
          gambar,
          urutan: urutan || 0,
        },
      });

      return res.status(200).json(section);
    } catch (error) {
      console.error('Error updating home section:', error);
      return res.status(500).json({ error: 'Failed to update home section' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.homeSections.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Home section deleted successfully' });
    } catch (error) {
      console.error('Error deleting home section:', error);
      return res.status(500).json({ error: 'Failed to delete home section' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
