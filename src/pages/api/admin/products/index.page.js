import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth].page';
import { executePrismaQuery } from '@src/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const products = await executePrismaQuery(async (prisma) => {
        return await prisma.produk.findMany({
          orderBy: {
            tanggalDibuat: 'desc',
          },
        });
      });

      // Transform data to match frontend expectations
      const formattedProducts = products.map((product) => ({
        id: product.id,
        name: product.nama,
        category: product.kategori,
        price: product.harga,
        discount: product.diskon || 0,
        stock: product.stok || 0,
        images: product.gambar || [],
        thumbnail: product.thumbnail || (product.gambar && product.gambar[0]) || null,
        mainImage: product.thumbnail || (product.gambar && product.gambar[0]) || null,
        status: product.stok > 0 ? 'In Stock' : 'Out of Stock',
        sizes: product.ukuran || [],
        colors: product.warna || [],
        featured: product.produkUnggulan || false,
        totalSold: product.jumlahTerjual || 0,
        createdAt: product.tanggalDibuat,
        updatedAt: product.tanggalDiubah,
      }));

      return res.status(200).json({ 
        success: true,
        products: formattedProducts,
        total: formattedProducts.length,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        nama,
        deskripsi,
        kategori,
        harga,
        diskon = 0,
        stok = 0,
        ukuran = [],
        warna = [],
        gambar = [],
        thumbnail = null,
        sections = [],
        video = [],
        produkUnggulan = false,
      } = req.body;

      // Validate required fields
      if (!nama || !kategori || !harga) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate unique ID
      const id = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const product = await executePrismaQuery(async (prisma) => {
        return await prisma.produk.create({
          data: {
            id,
            nama,
            deskripsi: deskripsi || '',
            kategori,
            harga: parseFloat(harga),
            diskon: parseFloat(diskon),
            stok: parseInt(stok, 10),
            ukuran,
            warna,
            gambar,
            thumbnail: thumbnail || (gambar && gambar[0]) || null,
            sections,
            video,
            produkUnggulan,
            urutanTampilan: 0,
            jumlahTerjual: 0,
          },
        });
      });

      return res.status(201).json({ 
        success: true,
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
