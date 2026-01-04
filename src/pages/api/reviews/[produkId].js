import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth].page';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { produkId } = req.query;

  // GET - Mengambil semua review untuk produk tertentu
  if (req.method === 'GET') {
    try {
      const reviews = await prisma.review.findMany({
        where: { produkId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Hitung rating rata-rata
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      return res.status(200).json({
        reviews,
        stats: {
          totalReviews: reviews.length,
          averageRating: Number(averageRating.toFixed(1)),
        },
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Gagal mengambil review' });
    }
  }

  // POST - Menambahkan review baru
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Anda harus login terlebih dahulu' });
    }

    const { rating, comment } = req.body;

    // Validasi input
    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating dan komentar harus diisi' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating harus antara 1-5' });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({ error: 'Komentar minimal 10 karakter' });
    }

    try {
      // Cek apakah user sudah pernah membeli produk ini
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          produkId,
          order: {
            userId: session.user.id,
            status: 'completed', // Hanya order yang sudah selesai
          },
        },
      });

      if (!hasPurchased) {
        return res.status(403).json({ 
          error: 'Anda hanya bisa memberikan review untuk produk yang sudah Anda beli' 
        });
      }

      // Cek apakah user sudah pernah review produk ini
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_produkId: {
            userId: session.user.id,
            produkId,
          },
        },
      });

      if (existingReview) {
        return res.status(400).json({ 
          error: 'Anda sudah memberikan review untuk produk ini' 
        });
      }

      // Buat review baru
      const review = await prisma.review.create({
        data: {
          userId: session.user.id,
          produkId,
          rating: parseInt(rating, 10),
          comment: comment.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return res.status(201).json({ review, message: 'Review berhasil ditambahkan' });
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Gagal menambahkan review' });
    }
  }

  // Method tidak didukung
  return res.status(405).json({ error: 'Method tidak didukung' });
}
