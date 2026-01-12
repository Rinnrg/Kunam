import { getServerSession } from 'next-auth/next';
import prisma from '@src/lib/db';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, userAuthOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse userId and validate
    const userId = parseInt(session.user.id, 10);

    // Validate userId - check if it's a valid number and not NaN
    if (!userId || Number.isNaN(userId) || userId <= 0) {
      console.error('[Cart API] Invalid userId:', session.user.id, 'Type:', typeof session.user.id);
      console.error('[Cart API] Session user:', JSON.stringify(session.user, null, 2));
      return res.status(400).json({ 
        message: 'Invalid user ID. Please log out and log in again.', 
        userId: session.user.id,
        debug: process.env.NODE_ENV === 'development' ? {
          rawUserId: session.user.id,
          parsedUserId: userId,
          userIdType: typeof session.user.id
        } : undefined
      });
    }

  // GET - Get user's cart
  if (req.method === 'GET') {
    try {
      const cart = await prisma.carts.findMany({
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

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity tidak valid' });
      }

      if (produk.stok <= 0) {
        return res.status(400).json({ message: 'Stok produk habis', available: 0 });
      }

      // Check if already in cart with same ukuran and warna
      const existing = await prisma.carts.findFirst({
        where: {
          userId,
          produkId,
          ukuran: ukuran || null,
          warna: warna || null,
        },
      });

      let cartItem;
      let adjusted = false;

      if (existing) {
        const desired = existing.quantity + quantity;
        const finalQty = Math.min(desired, produk.stok);
        adjusted = finalQty !== desired;

        cartItem = await prisma.carts.update({
          where: { id: existing.id },
          data: {
            quantity: finalQty,
            updatedAt: new Date(),
          },
          include: {
            produk: true,
          },
        });
      } else {
        const finalQty = Math.min(quantity, produk.stok);
        adjusted = finalQty !== quantity;

        cartItem = await prisma.carts.create({
          data: {
            userId,
            produkId,
            quantity: finalQty,
            ukuran: ukuran || null,
            warna: warna || null,
            updatedAt: new Date(),
          },
          include: {
            produk: true,
          },
        });
      }

      return res.status(201).json({
        message: 'Berhasil ditambahkan ke keranjang',
        cartItem,
        adjusted,
        available: produk.stok,
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

      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ message: 'Quantity tidak valid' });
      }

      const cartRecord = await prisma.carts.findUnique({ where: { id: cartId } });
      if (!cartRecord) {
        return res.status(404).json({ message: 'Item tidak ditemukan di keranjang' });
      }

      const produk = await prisma.produk.findUnique({ where: { id: cartRecord.produkId } });
      if (!produk) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      if (quantity < 1) {
        // Delete if quantity is 0 or less
        await prisma.carts.delete({ where: { id: cartId } });
        return res.status(200).json({ message: 'Item dihapus dari keranjang' });
      }

      if (produk.stok <= 0) {
        // Product out of stock, remove item
        await prisma.carts.delete({ where: { id: cartId } });
        return res.status(400).json({ message: 'Stok produk habis', available: 0 });
      }

      const finalQty = Math.min(quantity, produk.stok);
      const adjusted = finalQty !== quantity;

      const cartItem = await prisma.carts.update({
        where: { id: cartId },
        data: {
          quantity: finalQty,
          updatedAt: new Date(),
        },
        include: {
          produk: true,
        },
      });

      return res.status(200).json({
        message: 'Keranjang berhasil diupdate',
        cartItem,
        adjusted,
        available: produk.stok,
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

      await prisma.carts.delete({
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Cart Handler] Unhandled Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
