import prisma from '@src/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sections = await prisma.homeSections.findMany({
        orderBy: {
          urutan: 'asc',
        },
      });

      return res.status(200).json(sections);
    } catch (error) {
      console.error('Error fetching home sections:', error);
      return res.status(500).json({ error: 'Failed to fetch home sections' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { judul, gambar, urutan } = req.body;

      if (!judul || !gambar || !Array.isArray(gambar) || gambar.length === 0) {
        return res.status(400).json({ error: 'Judul dan gambar harus diisi' });
      }

      const section = await prisma.homeSections.create({
        data: {
          judul,
          gambar,
          urutan: urutan || 0,
        },
      });

      return res.status(201).json(section);
    } catch (error) {
      console.error('Error creating home section:', error);
      return res.status(500).json({ error: 'Failed to create home section' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
