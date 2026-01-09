import prisma from '@src/lib/prisma';

/**
 * Manual stock update endpoint for testing
 * This endpoint processes stock updates for paid orders
 * Use this if Midtrans webhook notification fails to update stock
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderNumber } = req.body;

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
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'settlement') {
      return res.status(400).json({ 
        error: 'Order is not paid yet',
        currentStatus: order.paymentStatus,
      });
    }

    // Check if stock already updated
    if (order.stockUpdated) {
      return res.status(400).json({
        error: 'Stock already updated for this order',
        orderNumber,
        stockUpdated: true,
      });
    }

    console.log(`📦 Processing stock for order ${orderNumber}...`);

    // Update product stock
    const updatePromises = order.order_items.map(async (item) => {
      try {
        // Get current product data
        const product = await prisma.produk.findUnique({
          where: { id: item.produkId },
          select: { id: true, nama: true, stok: true, jumlahTerjual: true },
        });

        if (!product) {
          return {
            produkId: item.produkId,
            status: 'error',
            message: 'Product not found',
          };
        }

        const currentStock = product.stok;
        const currentSold = product.jumlahTerjual;

        // Update stock and sold count
        await prisma.produk.update({
          where: { id: item.produkId },
          data: {
            jumlahTerjual: { increment: item.quantity },
            stok: { decrement: item.quantity },
          },
        });

        // Get updated data
        const updatedProduct = await prisma.produk.findUnique({
          where: { id: item.produkId },
          select: { stok: true, jumlahTerjual: true },
        });

        console.log(`  ✅ ${product.nama}: stock ${currentStock} → ${updatedProduct.stok}, sold ${currentSold} → ${updatedProduct.jumlahTerjual}`);
        
        return {
          produkId: item.produkId,
          nama: product.nama,
          status: 'success',
          quantity: item.quantity,
          before: {
            stok: currentStock,
            jumlahTerjual: currentSold,
          },
          after: {
            stok: updatedProduct.stok,
            jumlahTerjual: updatedProduct.jumlahTerjual,
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

    const allResults = await Promise.all(updatePromises);
    
    // Mark order as stock updated
    await prisma.orders.update({
      where: { id: order.id },
      data: { stockUpdated: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Stock processed successfully',
      orderNumber,
      results: allResults,
    });
  } catch (error) {
    console.error('Error processing stock:', error);
    return res.status(500).json({ 
      error: 'Failed to process stock',
      message: error.message,
    });
  }
}
