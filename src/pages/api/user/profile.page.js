import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);

  // GET - Get user's profile information
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Profile GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
