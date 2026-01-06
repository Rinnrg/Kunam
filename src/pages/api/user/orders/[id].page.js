import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma';
import { userAuthOptions } from '../../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);
  const { id } = req.query;
  const orderId = parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  // GET - Get order detail
  if (req.method === 'GET') {
    try {
      const order = await prisma.orders.findFirst({
        where: { 
          id: orderId,
          userId,
        },
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
      });

      if (!order) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      }

      return res.status(200).json({ 
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Order Detail GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // PUT - Update order status (limited to cancellation for users)
  if (req.method === 'PUT') {
    try {
      const { status } = req.body;

      // Check if order exists and belongs to user
      const existingOrder = await prisma.orders.findFirst({
        where: { 
          id: orderId,
          userId,
        },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      }

      // Users can only cancel pending orders
      if (status === 'cancelled') {
        if (existingOrder.status !== 'pending') {
          return res.status(400).json({ 
            message: 'Hanya pesanan dengan status "menunggu pembayaran" yang dapat dibatalkan' 
          });
        }
      } else {
        return res.status(403).json({ message: 'Anda tidak diizinkan mengubah status pesanan' });
      }

      const updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date(),
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

      return res.status(200).json({ 
        order: {
          ...updatedOrder,
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
        message: 'Pesanan berhasil dibatalkan' 
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Order Detail PUT] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
