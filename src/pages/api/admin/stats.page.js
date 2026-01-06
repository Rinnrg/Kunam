import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated and is admin
  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET - Get dashboard statistics
  if (req.method === 'GET') {
    try {
      // Get total users
      const totalUsers = await prisma.users.count();

      // Get total products
      const totalProducts = await prisma.produk.count();

      // Get total orders
      const totalOrders = await prisma.orders.count();

      // Get orders by status
      const pendingOrders = await prisma.orders.count({
        where: { status: 'pending' },
      });

      const processingOrders = await prisma.orders.count({
        where: { status: 'processing' },
      });

      const completedOrders = await prisma.orders.count({
        where: { status: 'completed' },
      });

      const cancelledOrders = await prisma.orders.count({
        where: { status: 'cancelled' },
      });

      // Get total revenue (only from completed orders with settled payment)
      const revenueData = await prisma.orders.aggregate({
        where: {
          paymentStatus: 'settlement',
        },
        _sum: {
          totalAmount: true,
        },
      });

      // eslint-disable-next-line no-underscore-dangle
      const totalRevenue = revenueData._sum.totalAmount || 0;

      // Get pending revenue (pending payment)
      const pendingRevenueData = await prisma.orders.aggregate({
        where: {
          paymentStatus: 'pending',
        },
        _sum: {
          totalAmount: true,
        },
      });

      // eslint-disable-next-line no-underscore-dangle
      const pendingRevenue = pendingRevenueData._sum.totalAmount || 0;

      // Get recent orders (last 10)
      const recentOrders = await prisma.orders.findMany({
        take: 10,
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
          order_items: {
            select: {
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get top selling products
      const topProducts = await prisma.order_items.groupBy({
        by: ['produkId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      // Get full product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.produk.findUnique({
            where: { id: item.produkId },
            select: {
              id: true,
              nama: true,
              kategori: true,
              harga: true,
              gambar: true,
            },
          });
          return {
            ...product,
            // eslint-disable-next-line no-underscore-dangle
            totalSold: item._sum.quantity,
          };
        })
      );

      // Get revenue by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenue = await prisma.orders.groupBy({
        by: ['createdAt'],
        where: {
          paymentStatus: 'settlement',
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      // Process monthly revenue data
      const monthlyRevenueData = monthlyRevenue.reduce((acc, item) => {
        const month = new Date(item.createdAt).toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        // eslint-disable-next-line no-underscore-dangle
        acc[month] += item._sum.totalAmount || 0;
        return acc;
      }, {});

      // Serialize recent orders
      const serializedRecentOrders = recentOrders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }));

      return res.status(200).json({
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          pendingRevenue,
          ordersByStatus: {
            pending: pendingOrders,
            processing: processingOrders,
            completed: completedOrders,
            cancelled: cancelledOrders,
          },
        },
        recentOrders: serializedRecentOrders,
        topProducts: topProductsWithDetails,
        monthlyRevenue: monthlyRevenueData,
      });
    } catch (error) {
      console.error('[Admin Stats GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
