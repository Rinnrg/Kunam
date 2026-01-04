import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import prisma from '../../../lib/prisma';

// API untuk membuat order dummy (untuk testing purposes)
// TODO: Replace with actual payment/checkout flow
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak didukung' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu' });
  }

  const { produkId, quantity = 1, ukuran, warna } = req.body;

  if (!produkId) {
    return res.status(400).json({ error: 'Product ID harus disertakan' });
  }

  try {
    // Ambil data produk
    const produk = await prisma.produk.findUnique({
      where: { id: produkId },
    });

    if (!produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Hitung harga
    const price = produk.harga * (1 - produk.diskon / 100);
    const totalAmount = price * quantity;

    // Buat order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        status: 'completed', // Langsung completed untuk testing
        totalAmount,
        items: {
          create: {
            produkId,
            quantity,
            price,
            ukuran: ukuran || null,
            warna: warna || null,
          },
        },
      },
      include: {
        items: {
          include: {
            produk: true,
          },
        },
      },
    });

    // Update jumlah terjual produk
    await prisma.produk.update({
      where: { id: produkId },
      data: {
        jumlahTerjual: {
          increment: quantity,
        },
      },
    });

    return res.status(201).json({
      order,
      message: 'Order dummy berhasil dibuat. Anda sekarang bisa memberikan review!',
    });
  } catch (error) {
    console.error('Error creating dummy order:', error);
    return res.status(500).json({ error: 'Gagal membuat order' });
  }
}
