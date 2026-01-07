import { getServerSession } from 'next-auth/next';
import prisma from '@src/lib/db';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, userAuthOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseInt(session.user.id, 10);

    // Validate userId
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

  // GET - Get user's wishlist
  if (req.method === 'GET') {
    try {
      const wishlist = await prisma.wishlists.findMany({
        where: { userId },
        include: {
          produk: {
            select: {
              id: true,
              nama: true,
              kategori: true,
              harga: true,
              diskon: true,
              stok: true,
              gambar: true,
              ukuran: true,
              warna: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ wishlist });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wishlist GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // POST - Add to wishlist
  if (req.method === 'POST') {
    try {
      const { produkId } = req.body;

      if (!produkId) {
        return res.status(400).json({ message: 'Produk ID wajib diisi' });
      }

      // Check if product exists
      const produk = await prisma.produk.findUnique({
        where: { id: produkId },
      });

      if (!produk) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      // Check if already in wishlist
      const existing = await prisma.wishlists.findUnique({
        where: {
          userId_produkId: {
            userId,
            produkId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ message: 'Produk sudah ada di wishlist' });
      }

      const wishlistItem = await prisma.wishlists.create({
        data: {
          userId,
          produkId,
        },
        include: {
          produk: true,
        },
      });

      return res.status(201).json({
        message: 'Berhasil ditambahkan ke wishlist',
        wishlistItem,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wishlist POST] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // DELETE - Remove from wishlist
  if (req.method === 'DELETE') {
    try {
      const { produkId } = req.body;

      if (!produkId) {
        return res.status(400).json({ message: 'Produk ID wajib diisi' });
      }

      await prisma.wishlists.delete({
        where: {
          userId_produkId: {
            userId,
            produkId,
          },
        },
      });

      return res.status(200).json({ message: 'Berhasil dihapus dari wishlist' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wishlist DELETE] Error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Item tidak ditemukan di wishlist' });
      }
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Wishlist Handler] Unhandled Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
