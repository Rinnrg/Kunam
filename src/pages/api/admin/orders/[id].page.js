import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is admin
  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const orderId = parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  // GET - Get order by ID
  if (req.method === 'GET') {
    try {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
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
      });

      if (!order) {
        return res.status(404).json({ message: 'Order tidak ditemukan' });
      }

      return res.status(200).json({
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          transactionTime: order.transactionTime ? order.transactionTime.toISOString() : null,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        },
      });
    } catch (error) {
      console.error('[Admin Order GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // DELETE - Delete order
  if (req.method === 'DELETE') {
    try {
      // Check if order exists
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          order_items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Order tidak ditemukan' });
      }

      // Delete order (order_items will be deleted automatically due to cascade)
      await prisma.orders.delete({
        where: { id: orderId },
      });

      return res.status(200).json({
        message: 'Order berhasil dihapus',
        deletedOrderId: orderId,
      });
    } catch (error) {
      console.error('[Admin Order DELETE] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // PATCH - Update order
  if (req.method === 'PATCH') {
    try {
      const { status, paymentStatus, customerName, customerEmail, customerPhone } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (customerName) updateData.customerName = customerName;
      if (customerEmail) updateData.customerEmail = customerEmail;
      if (customerPhone) updateData.customerPhone = customerPhone;
      updateData.updatedAt = new Date();

      const order = await prisma.orders.update({
        where: { id: orderId },
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
        message: 'Order berhasil diperbarui',
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          transactionTime: order.transactionTime ? order.transactionTime.toISOString() : null,
          paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        },
      });
    } catch (error) {
      console.error('[Admin Order PATCH] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
