import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import { prisma } from '../../../lib/db';

async function getProduk(req, res) {
  try {
    const produk = await prisma.produk.findMany({
      orderBy: [
        { produkUnggulan: 'desc' },
        { urutanTampilan: 'asc' },
        { tanggalDibuat: 'desc' },
      ],
    });

    return res.status(200).json(produk);
  } catch (error) {
    console.error('Error fetching produk:', error);
    return res.status(500).json({ message: 'Error fetching produk' });
  }
}

async function createProduk(req, res) {
  try {
    const { nama, deskripsi, kategori, harga, diskon, stok, ukuran, warna, images, videos, featured, order } = req.body;

    // Validasi input
    if (!nama || !kategori || harga === undefined) {
      return res.status(400).json({
        message: 'Nama, kategori, dan harga wajib diisi',
      });
    }

    console.log('Creating produk with data:', {
      nama,
      deskripsi,
      kategori,
      harga,
      diskon,
      stok,
      ukuran,
      warna,
      images,
      videos,
      featured,
      order,
    });

    const produk = await prisma.produk.create({
      data: {
        nama,
        deskripsi: deskripsi || null,
        kategori,
        harga: parseFloat(harga),
        diskon: parseFloat(diskon) || 0,
        stok: parseInt(stok, 10) || 0,
        ukuran: ukuran || [],
        warna: warna || [],
        gambar: images || [],
        video: videos || [],
        produkUnggulan: featured || false,
        urutanTampilan: order || 0,
      },
    });

    console.log('Produk created successfully:', produk);
    return res.status(201).json(produk);
  } catch (error) {
    console.error('Error creating produk:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
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
