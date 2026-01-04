import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);

  // GET - Get user's cart
  if (req.method === 'GET') {
    try {
      const cart = await prisma.cart.findMany({
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

      // Calculate total
      const total = cart.reduce((sum, item) => {
        const price = item.produk.harga * (1 - item.produk.diskon / 100);
        return sum + price * item.quantity;
      }, 0);

      return res.status(200).json({ cart, total });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Cart GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // POST - Add to cart
  if (req.method === 'POST') {
    try {
      const { produkId, quantity = 1, ukuran, warna } = req.body;

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

      // Check if already in cart with same ukuran and warna
      const existing = await prisma.cart.findFirst({
        where: {
          userId,
          produkId,
          ukuran: ukuran || null,
          warna: warna || null,
        },
      });

      let cartItem;

      if (existing) {
        // Update quantity
        cartItem = await prisma.cart.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
          },
          include: {
            produk: true,
          },
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cart.create({
          data: {
            userId,
            produkId,
            quantity,
            ukuran: ukuran || null,
            warna: warna || null,
          },
          include: {
            produk: true,
          },
        });
      }

      return res.status(201).json({
        message: 'Berhasil ditambahkan ke keranjang',
        cartItem,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Cart POST] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // PUT - Update cart item quantity
  if (req.method === 'PUT') {
    try {
      const { cartId, quantity } = req.body;

      if (!cartId || quantity === undefined) {
        return res.status(400).json({ message: 'Cart ID dan quantity wajib diisi' });
      }

      if (quantity < 1) {
        // Delete if quantity is 0 or less
        await prisma.cart.delete({
          where: { id: cartId },
        });
        return res.status(200).json({ message: 'Item dihapus dari keranjang' });
      }

      const cartItem = await prisma.cart.update({
        where: { id: cartId },
        data: { quantity },
        include: {
          produk: true,
        },
      });

      return res.status(200).json({
        message: 'Keranjang berhasil diupdate',
        cartItem,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Cart PUT] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // DELETE - Remove from cart
  if (req.method === 'DELETE') {
    try {
      const { cartId } = req.body;

      if (!cartId) {
        return res.status(400).json({ message: 'Cart ID wajib diisi' });
      }

      await prisma.cart.delete({
        where: { id: cartId },
      });

      return res.status(200).json({ message: 'Berhasil dihapus dari keranjang' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Cart DELETE] Error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Item tidak ditemukan di keranjang' });
      }
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
