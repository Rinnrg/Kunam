import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is admin
  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Get all orders with user details
  if (req.method === 'GET') {
    try {
      const { status, search, startDate, endDate } = req.query;
      
      // Build where clause
      const where = {};
      
      if (status && status !== 'all') {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const orders = await prisma.orders.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              phone: true,
            },
          },
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
        transactionTime: order.transactionTime ? order.transactionTime.toISOString() : null,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      }));

      return res.status(200).json({ orders: serializedOrders });
    } catch (error) {
      console.error('[Admin Orders GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // PATCH - Update order status
  if (req.method === 'PATCH') {
    try {
      const { orderId, status, paymentStatus } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: 'Order ID diperlukan' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      updateData.updatedAt = new Date();

      const order = await prisma.orders.update({
        where: { id: parseInt(orderId, 10) },
        data: updateData,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
        message: 'Status pesanan berhasil diperbarui',
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('[Admin Orders PATCH] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
