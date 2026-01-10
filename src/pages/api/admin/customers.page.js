import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth].page';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user?.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ];
      }

      // Get total count
      const total = await prisma.users.count({ where });

      // Build orderBy clause
      const orderBy = {};
      orderBy[sortBy] = order;

      // Get users with their related data
      const users = await prisma.users.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          _count: {
            select: {
              orders: true,
              reviews: true,
              wishlists: true,
              carts: true,
            },
          },
          orders: {
            where: {
              // Only include orders that were actually paid/settled
              paymentStatus: {
                in: ['settlement', 'paid'],
              },
            },
            select: {
              totalAmount: true,
              paymentStatus: true,
            },
          },
        },
      });

      // Calculate statistics for each user
      const usersWithStats = users.map(user => {
        // Sum only the included (paid) orders safely
        const totalSpent = user.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalOrders = user.orders.length; // Only count paid/settled orders
        const count = user._count; // Extract _count to avoid linting issues

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          image: user.image,
          provider: user.provider,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          stats: {
            totalOrders: totalOrders,
            totalReviews: count.reviews,
            totalWishlists: count.wishlists,
            totalCartItems: count.carts,
            totalSpent,
          },
        };
      });

      return res.status(200).json({
        users: usersWithStats,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await prisma.users.delete({
        where: { id: parseInt(id, 10) },
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
