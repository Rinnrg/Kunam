import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth].page';
import prisma from '@src/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    // Find order
    const order = await prisma.orders.findUnique({
      where: { orderNumber },
      include: {
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order
    if (order.users.email !== session.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'pending' && order.paymentStatus !== 'pending') {
      return res.status(400).json({ 
        error: 'Order cannot be cancelled',
        message: 'Hanya pesanan dengan status menunggu pembayaran yang bisa dibatalkan.',
      });
    }

    // Get order items to restore stock
    const orderItems = await prisma.order_items.findMany({
      where: { orderId: order.id },
    });

    // Update order status to cancelled
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        paymentStatus: 'cancel',
      },
    });

    // Restore product stock (only if not yet paid)
    if (order.paymentStatus === 'pending') {
      const stockRestorePromises = orderItems.map((item) =>
        prisma.produk.update({
          where: { id: item.produkId },
          data: {
            stok: { increment: item.quantity },
          },
        })
      );
      await Promise.all(stockRestorePromises);
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
}
