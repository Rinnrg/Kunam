import { getServerSession } from 'next-auth/next';
import { executePrismaQuery } from '@src/lib/prisma';
import { authOptions } from '../../auth/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const reviews = await executePrismaQuery(async (prisma) => {
        return prisma.reviews.findMany({
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            produk: {
              select: {
                id: true,
                nama: true,
                gambar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      // Calculate statistics
      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      // Rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((review) => {
        ratingDistribution[review.rating] += 1;
      });

      return res.status(200).json({
        success: true,
        reviews,
        stats: {
          totalReviews,
          averageRating: Number(averageRating.toFixed(1)),
          ratingDistribution,
        },
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
