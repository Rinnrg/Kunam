import prisma from '@src/lib/prisma';

/**
 * Manual endpoint to force stock update for an order
 * POST /api/debug/force-stock-update
 * Body: { orderNumber: "KNM-xxx" }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' });
    }

    // Get order with items
    const order = await prisma.orders.findUnique({
      where: { orderNumber },
      include: {
        order_items: {
          include: {
            produk: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`🔧 Manual stock update for order: ${orderNumber}`);
    console.log(`   Current payment status: ${order.paymentStatus}`);
    console.log(`   Stock already updated: ${order.stockUpdated}`);

    // Check if already updated
    if (order.stockUpdated) {
      return res.status(400).json({
        error: 'Stock already updated for this order',
        orderNumber,
        stockUpdated: true,
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'settlement') {
      return res.status(400).json({
        error: 'Order must be paid (settlement) to update stock',
        orderNumber,
        currentStatus: order.paymentStatus,
      });
    }

    // Update each product using Promise.all to avoid await in loop
    const updatePromises = order.order_items.map(async (item) => {
      try {
        const productBefore = await prisma.produk.findUnique({
          where: { id: item.produkId },
          select: { stok: true, jumlahTerjual: true, nama: true },
        });

        if (!productBefore) {
          return {
            produkId: item.produkId,
            status: 'error',
            message: 'Product not found',
          };
        }

        console.log(`  📦 Updating ${productBefore.nama}`);
        console.log(`     Before: stock=${productBefore.stok}, sold=${productBefore.jumlahTerjual}`);
        console.log(`     Change: stock -${item.quantity}, sold +${item.quantity}`);

        const updated = await prisma.produk.update({
          where: { id: item.produkId },
          data: {
            stok: { decrement: item.quantity },
            jumlahTerjual: { increment: item.quantity },
          },
          select: { stok: true, jumlahTerjual: true },
        });

        console.log(`     After: stock=${updated.stok}, sold=${updated.jumlahTerjual}`);

        return {
          produkId: item.produkId,
          productName: productBefore.nama,
          status: 'success',
          before: {
            stok: productBefore.stok,
            jumlahTerjual: productBefore.jumlahTerjual,
          },
          after: {
            stok: updated.stok,
            jumlahTerjual: updated.jumlahTerjual,
          },
        };
      } catch (error) {
        console.error(`  ❌ Error updating product ${item.produkId}:`, error);
        return {
          produkId: item.produkId,
          status: 'error',
          message: error.message,
        };
      }
    });

    const results = await Promise.all(updatePromises);

    // Mark order as stock updated
    await prisma.orders.update({
      where: { id: order.id },
      data: { stockUpdated: true },
    });

    console.log(`✅ Manual stock update complete for ${orderNumber}`);

    return res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      orderNumber,
      results,
    });
  } catch (error) {
    console.error('❌ Error in manual stock update:', error);
    return res.status(500).json({
      error: 'Failed to update stock',
      message: error.message,
    });
  }
}
