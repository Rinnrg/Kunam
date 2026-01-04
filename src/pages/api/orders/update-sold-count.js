import prisma from '../../../lib/prisma';

// API untuk update jumlah terjual produk
// Akan dipanggil otomatis ketika order status berubah menjadi "completed"
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak didukung' });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID harus disertakan' });
  }

  try {
    // Ambil order dengan items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Order belum completed' });
    }

    // Update jumlah terjual untuk setiap produk di order
    const updatePromises = order.items.map((item) =>
      prisma.produk.update({
        where: { id: item.produkId },
        data: {
          jumlahTerjual: {
            increment: item.quantity,
          },
        },
      }),
    );

    await Promise.all(updatePromises);

    return res.status(200).json({
      message: 'Jumlah terjual berhasil diupdate',
      updatedProducts: order.items.length,
    });
  } catch (error) {
    console.error('Error updating sold count:', error);
    return res.status(500).json({ error: 'Gagal mengupdate jumlah terjual' });
  }
}
