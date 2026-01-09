import prisma from '@src/lib/prisma';

/**
 * Debug endpoint to check stock update status
 * GET /api/debug/check-stock?orderNumber=KNM-xxx
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderNumber } = req.query;

    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' });
    }

    // Get order with items
    const order = await prisma.orders.findUnique({
      where: { orderNumber },
      include: {
        order_items: {
          include: {
            produk: {
              select: {
                id: true,
                nama: true,
                stok: true,
                jumlahTerjual: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        stockUpdated: order.stockUpdated,
        paidAt: order.paidAt,
        totalAmount: order.totalAmount,
      },
      items: order.order_items.map(item => ({
        produkId: item.produkId,
        productName: item.produk.nama,
        quantity: item.quantity,
        currentStock: item.produk.stok,
        currentSold: item.produk.jumlahTerjual,
      })),
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    return res.status(500).json({ 
      error: 'Failed to check stock',
      message: error.message,
    });
  }
}
