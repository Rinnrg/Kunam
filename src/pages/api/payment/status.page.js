import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth].page';
import prisma from '@src/lib/prisma';
import { coreApi, mapPaymentStatus } from '@src/lib/midtrans';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderNumber } = req.query;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    // Find order
    const order = await prisma.orders.findUnique({
      where: { orderNumber },
      include: {
        order_items: {
          include: {
            produk: true,
          },
        },
        users: {
          select: {
            id: true,
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

    // Try to get latest status from Midtrans
    try {
      const transactionStatus = await coreApi.transaction.status(orderNumber);
      
      const { status, paymentStatus } = mapPaymentStatus(
        transactionStatus.transaction_status,
        transactionStatus.fraud_status
      );

      // Update order if status changed
      if (order.paymentStatus !== paymentStatus) {
        const updateData = {
          status,
          paymentStatus,
          paymentType: transactionStatus.payment_type,
          transactionId: transactionStatus.transaction_id,
          transactionTime: transactionStatus.transaction_time 
            ? new Date(transactionStatus.transaction_time) 
            : null,
        };

        if (paymentStatus === 'settlement' && !order.paidAt) {
          updateData.paidAt = new Date();
        }

        await prisma.orders.update({
          where: { id: order.id },
          data: updateData,
        });

        order.status = status;
        order.paymentStatus = paymentStatus;
        order.paymentType = transactionStatus.payment_type;
      }
    } catch (error) {
      // If Midtrans call fails, just return current order status
      console.log('Could not fetch Midtrans status:', error.message);
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentType: order.paymentType,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        transactionId: order.transactionId,
        transactionTime: order.transactionTime,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        items: order.order_items,
        snapToken: order.snapToken,
      },
    });
  } catch (error) {
    console.error('Error checking order status:', error);
    return res.status(500).json({ error: 'Failed to check order status' });
  }
}
