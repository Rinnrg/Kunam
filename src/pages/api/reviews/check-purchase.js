import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import prisma from '../../../lib/prisma';

// API untuk cek apakah user sudah membeli produk dan apakah sudah review
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak didukung' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu' });
  }

  const { produkId } = req.body;

  if (!produkId) {
    return res.status(400).json({ error: 'Product ID harus disertakan' });
  }

  try {
    // Cek apakah user sudah pernah membeli produk ini
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        produkId,
        order: {
          userId: session.user.id,
          status: 'completed',
        },
      },
    });

    // Cek apakah user sudah pernah review produk ini
    const hasReviewed = await prisma.review.findUnique({
      where: {
        userId_produkId: {
          userId: session.user.id,
          produkId,
        },
      },
    });

    return res.status(200).json({
      canReview: hasPurchased && !hasReviewed,
      hasPurchased: !!hasPurchased,
      hasReviewed: !!hasReviewed,
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return res.status(500).json({ error: 'Gagal memeriksa status pembelian' });
  }
}
