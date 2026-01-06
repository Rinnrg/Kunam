import crypto from 'crypto';
import prisma from '@src/lib/prisma';
import { mapPaymentStatus } from '@src/lib/midtrans';

// Disable body parser for this route as we need raw body for signature verification
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    const {
      order_id: orderId,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      transaction_id: transactionId,
      transaction_time: transactionTime,
      payment_type: paymentType,
      signature_key: signatureKey,
      status_code: statusCode,
      gross_amount: grossAmount,
    } = notification;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    if (hash !== signatureKey) {
      console.error('Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Find order by order number
    const order = await prisma.orders.findUnique({
      where: { orderNumber: orderId },
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Map payment status to order status
    const { status, paymentStatus } = mapPaymentStatus(transactionStatus, fraudStatus);

    // Update order
    const updateData = {
      status,
      paymentStatus,
      paymentType,
      transactionId,
      transactionTime: transactionTime ? new Date(transactionTime) : null,
    };

    // Set paidAt if payment is successful
    if (paymentStatus === 'settlement') {
      updateData.paidAt = new Date();
      
      // Update product sold count
      const orderItems = await prisma.order_items.findMany({
        where: { orderId: order.id },
      });

      // Update all products in parallel
      const updatePromises = orderItems.map((item) =>
        prisma.produk.update({
          where: { id: item.produkId },
          data: {
            jumlahTerjual: { increment: item.quantity },
            stok: { decrement: item.quantity },
          },
        })
      );
      await Promise.all(updatePromises);
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: updateData,
    });

    console.log(`Order ${orderId} updated: status=${status}, paymentStatus=${paymentStatus}`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling notification:', error);
    return res.status(500).json({ error: 'Failed to process notification' });
  }
}
