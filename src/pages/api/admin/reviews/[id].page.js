import { getServerSession } from 'next-auth/next';
import { executePrismaQuery } from '@src/lib/prisma';
import { authOptions } from '../../auth/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await executePrismaQuery(async (prisma) => {
        return prisma.reviews.delete({
          where: { id: parseInt(id, 10) },
        });
      });

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ error: 'Failed to delete review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
