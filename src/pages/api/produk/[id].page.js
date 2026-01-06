import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import { prisma } from '../../../lib/db';

async function getProduk(req, res, id) {
  try {
    const produk = await prisma.produk.findUnique({
      where: { id },
    });

    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    return res.status(200).json(produk);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching produk' });
  }
}

async function updateProduk(req, res, id) {
  try {
    const { nama, deskripsi, sections, kategori, harga, diskon, stok, ukuran, warna, thumbnail, images, videos } = req.body;

    // Validasi sections jika ada
    if (sections && !Array.isArray(sections)) {
      return res.status(400).json({
        message: 'Sections harus berupa array',
      });
    }

    // Validasi setiap section
    if (sections) {
      for (const section of sections) {
        if (!section.judul || !section.deskripsi) {
          return res.status(400).json({
            message: 'Setiap section harus memiliki judul dan deskripsi',
          });
        }
      }
    }

    const produk = await prisma.produk.update({
      where: { id },
      data: {
        nama,
        deskripsi,
        sections: sections !== undefined ? sections : undefined,
        kategori,
        harga: parseFloat(harga),
        diskon: diskon ? parseFloat(diskon) : 0,
        stok: parseInt(stok, 10),
        ukuran,
        warna,
        thumbnail: thumbnail || null,
        gambar: images,
        video: videos,
      },
    });

    return res.status(200).json(produk);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    return res.status(500).json({ message: 'Error updating produk' });
  }
}

async function deleteProduk(req, res, id) {
  try {
    await prisma.produk.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    return res.status(500).json({ message: 'Error deleting produk' });
  }
}

export default async function handler(req, res) {
  // Check authentication for non-GET requests
  const session = await getServerSession(req, res, authOptions);

  if (!session && req.method !== 'GET') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Produk ID diperlukan' });
  }

  switch (req.method) {
    case 'GET':
      return getProduk(req, res, id);
    case 'PUT':
      return updateProduk(req, res, id);
    case 'DELETE':
      return deleteProduk(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
