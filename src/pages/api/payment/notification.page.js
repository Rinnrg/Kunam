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
    
    console.log('📨 Received Midtrans Notification:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
      fraud_status: notification.fraud_status,
    });
    
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
      console.error('❌ Invalid signature for order:', orderId);
      console.error('Expected:', hash);
      console.error('Received:', signatureKey);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    console.log('✅ Signature verified for order:', orderId);

    // Find order by order number
    const order = await prisma.orders.findUnique({
      where: { orderNumber: orderId },
      include: {
        order_items: true,
      },
    });

    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('📦 Found order:', order.id, 'Current status:', order.paymentStatus);

    // Map payment status to order status
    const { status, paymentStatus } = mapPaymentStatus(transactionStatus, fraudStatus);

    // Check if status already updated (idempotency)
    if (order.paymentStatus === paymentStatus && order.status === status) {
      console.log('ℹ️  Order already updated with same status. Skipping duplicate notification.');
      return res.status(200).json({ 
        success: true,
        message: 'Duplicate notification - already processed',
        order_id: orderId,
        status,
        payment_status: paymentStatus,
      });
    }

    // Update order
    const updateData = {
      status,
      paymentStatus,
      paymentType,
      transactionId,
      transactionTime: transactionTime ? new Date(transactionTime) : null,
    };

    // Set paidAt if payment is successful
    if (paymentStatus === 'settlement' && !order.paidAt) {
      updateData.paidAt = new Date();
      
      console.log('💰 Payment settled! Updating product stock and sold count...');
      
      // Update product sold count
      const orderItems = order.order_items;

      // Update all products in parallel
      const updatePromises = orderItems.map((item) =>
        prisma.produk.update({
          where: { id: item.produkId },
          data: {
            jumlahTerjual: { increment: item.quantity },
            stok: { decrement: item.quantity },
          },
        }).then(() => {
          console.log(`  ✅ Updated product ${item.produkId}: +${item.quantity} sold, -${item.quantity} stock`);
        })
      );
      await Promise.all(updatePromises);
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: updateData,
    });

    console.log(`✅ Order ${orderId} updated successfully!`);
    console.log(`   Status: ${order.status} → ${status}`);
    console.log(`   Payment: ${order.paymentStatus} → ${paymentStatus}`);
    if (updateData.paidAt) {
      console.log(`   💵 Paid at: ${updateData.paidAt.toISOString()}`);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Notification processed successfully',
      order_id: orderId,
      status,
      payment_status: paymentStatus,
    });
  } catch (error) {
    console.error('❌ Error handling notification:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to process notification' });
  }
}
