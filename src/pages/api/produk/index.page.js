import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import { prisma } from '../../../lib/db';

async function getProduk(req, res) {
  try {
    const { limit = 50, kategori } = req.query;
    
    const whereClause = kategori ? { kategori } : {};
    
    const produk = await prisma.produk.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        kategori: true,
        harga: true,
        diskon: true,
        stok: true,
        deskripsi: true,
        sections: true,
        ukuran: true,
        warna: true,
        thumbnail: true,
        gambar: true,
        video: true,
        produkUnggulan: true,
        urutanTampilan: true,
        tanggalDibuat: true,
        tanggalDiubah: true,
      },
      orderBy: [{ produkUnggulan: 'desc' }, { urutanTampilan: 'asc' }, { tanggalDibuat: 'desc' }],
      take: parseInt(limit, 10),
    });

    return res.status(200).json(produk);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching produk' });
  }
}

async function createProduk(req, res) {
  try {
    const { nama, deskripsi, sections, kategori, harga, diskon, stok, ukuran, warna, thumbnail, images, videos, featured, order } = req.body;

    // Validasi input
    if (!nama || !kategori || harga === undefined) {
      return res.status(400).json({
        message: 'Nama, kategori, dan harga wajib diisi',
      });
    }

    // Validasi sections jika ada
    if (sections && !Array.isArray(sections)) {
      return res.status(400).json({
        message: 'Sections harus berupa array',
      });
    }

    // Validasi setiap section
    if (sections) {
      const hasInvalidSection = sections.some((section) => !section.judul || !section.deskripsi);
      if (hasInvalidSection) {
        return res.status(400).json({
          message: 'Setiap section harus memiliki judul dan deskripsi',
        });
      }
    }

    // Generate unique ID from nama (slug format) and timestamp
    const generateId = (productName) => {
      const slug = productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const timestamp = Date.now();
      return `${slug}-${timestamp}`;
    };

    const produk = await prisma.produk.create({
      data: {
        id: generateId(nama),
        nama,
        deskripsi: deskripsi || null, // Keep for backward compatibility
        sections: sections || [],
        kategori,
        harga: parseFloat(harga),
        diskon: parseFloat(diskon) || 0,
        stok: parseInt(stok, 10) || 0,
        ukuran: ukuran || [],
        warna: warna || [],
        thumbnail: thumbnail || null,
        gambar: images || [],
        video: videos || [],
        produkUnggulan: featured || false,
        urutanTampilan: order || 0,
      },
    });

    return res.status(201).json(produk);
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating produk',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session && req.method !== 'GET') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getProduk(req, res);
    case 'POST':
      return createProduk(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
