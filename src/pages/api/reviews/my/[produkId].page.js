import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth].page';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { produkId } = req.query;

  // Require authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu' });
  }

  const userId = parseInt(session.user.id, 10);

  // GET - return the current user's review for this product (if any)
  if (req.method === 'GET') {
    try {
      const review = await prisma.reviews.findUnique({
        where: {
          userId_produkId: {
            userId,
            produkId,
          },
        },
      });

      if (!review) {
        return res.status(200).json({ review: null });
      }

      return res.status(200).json({ review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      }});
    } catch (error) {
      console.error('[User Review GET] Error:', error);
      return res.status(500).json({ error: 'Gagal mengambil ulasan Anda' });
    }
  }

  // PUT - update user's review for this product
  if (req.method === 'PUT') {
    const { rating, comment } = req.body;

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
      // Ensure the review exists
      const existingReview = await prisma.reviews.findUnique({
        where: {
          userId_produkId: {
            userId,
            produkId,
          },
        },
      });

      if (!existingReview) {
        return res.status(404).json({ error: 'Ulasan tidak ditemukan' });
      }

      const updated = await prisma.reviews.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating, 10),
          comment: comment.trim(),
        },
      });

      // Recalculate product rating
      const allReviews = await prisma.reviews.findMany({
        where: { produkId },
        select: { rating: true },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

      await prisma.produk.update({
        where: { id: produkId },
        data: {
          rating: Number(averageRating.toFixed(1)),
          totalReviews: allReviews.length,
        },
      });

      return res.status(200).json({ review: {
        id: updated.id,
        rating: updated.rating,
        comment: updated.comment,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }, message: 'Ulasan berhasil diperbarui' });
    } catch (error) {
      console.error('[User Review PUT] Error:', error);
      return res.status(500).json({ error: 'Gagal memperbarui ulasan' });
    }
  }

  return res.status(405).json({ error: 'Method tidak didukung' });
}
