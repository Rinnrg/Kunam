import { prisma } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 1) {
    return res.status(200).json({ results: [], suggestions: [] });
  }

  const searchTerm = q.trim().toLowerCase();

  try {
    // Search products by name, category, or description
    const products = await prisma.produk.findMany({
      where: {
        OR: [
          { nama: { contains: searchTerm, mode: 'insensitive' } },
          { kategori: { contains: searchTerm, mode: 'insensitive' } },
          { deskripsi: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: parseInt(limit, 10),
      orderBy: [{ produkUnggulan: 'desc' }, { nama: 'asc' }],
      select: {
        id: true,
        nama: true,
        kategori: true,
        harga: true,
        diskon: true,
        gambar: true,
      },
    });

    // Get unique categories that match
    const categories = await prisma.produk.findMany({
      where: {
        kategori: { contains: searchTerm, mode: 'insensitive' },
      },
      distinct: ['kategori'],
      select: {
        kategori: true,
      },
    });

    // Build suggestions from categories
    const suggestions = categories.map((cat) => ({
      type: 'category',
      value: cat.kategori,
      label: cat.kategori,
    }));

    // Add product name suggestions
    const productSuggestions = products.slice(0, 5).map((prod) => ({
      type: 'product',
      value: prod.nama,
      label: prod.nama,
      id: prod.id,
    }));

    return res.status(200).json({
      results: products,
      suggestions: [...suggestions, ...productSuggestions],
      total: products.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Error searching', error: error.message });
  }
}
