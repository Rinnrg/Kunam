import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);

  // GET - Get user's orders
  if (req.method === 'GET') {
    try {
      const orders = await prisma.orders.findMany({
        where: { userId },
        include: {
          order_items: {
            include: {
              produk: {
                select: {
                  id: true,
                  nama: true,
                  gambar: true,
                  kategori: true,
                  harga: true,
                  diskon: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Serialize dates
      const serializedOrders = orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }));

      return res.status(200).json({ orders: serializedOrders });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Orders GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // POST - Create a new order
  if (req.method === 'POST') {
    try {
      const { items, totalAmount } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Items diperlukan untuk membuat pesanan' });
      }

      // Generate order number
      const orderNumber = `KNM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const order = await prisma.orders.create({
        data: {
          userId,
          orderNumber,
          status: 'pending',
          totalAmount,
          updatedAt: new Date(),
          order_items: {
            create: items.map((item) => ({
              produkId: item.produkId,
              quantity: item.quantity,
              price: item.price,
              ukuran: item.ukuran || null,
              warna: item.warna || null,
            })),
          },
        },
        include: {
          order_items: {
            include: {
              produk: {
                select: {
                  id: true,
                  nama: true,
                  gambar: true,
                },
              },
            },
          },
        },
      });

      // Clear user's cart after successful order
      await prisma.carts.deleteMany({
        where: {
          userId,
          produkId: { in: items.map((item) => item.produkId) },
        },
      });

      return res.status(201).json({ 
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
        message: 'Pesanan berhasil dibuat' 
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Orders POST] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
