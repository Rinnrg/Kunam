import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/prisma';
import { userAuthOptions } from '../../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);
  const { id } = req.query;
  const orderId = parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  // GET - Get order detail
  if (req.method === 'GET') {
    try {
      const order = await prisma.orders.findFirst({
        where: { 
          id: orderId,
          userId,
        },
        include: {
          order_items: {
            include: {
              produk: {
                select: {
                  id: true,
                  nama: true,
                  gambar: true,
                  kategori: true,
                  harga: true,
                  diskon: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      }

      // Fetch user's reviews for products in this order (if any)
      const productIds = Array.from(new Set(order.order_items.map((item) => item.produkId)));
      let userReviews = [];
      if (productIds.length > 0) {
        userReviews = await prisma.reviews.findMany({
          where: {
            userId,
            produkId: { in: productIds },
          },
          select: {
            id: true,
            produkId: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      const reviewMap = {};
      userReviews.forEach((r) => {
        reviewMap[r.produkId] = r;
      });

      return res.status(200).json({ 
        order: {
          ...order,
          order_items: order.order_items.map((item) => {
            const r = reviewMap[item.produkId] || null;
            return {
              ...item,
              userReview: r
                ? {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt.toISOString(),
                    updatedAt: r.updatedAt.toISOString(),
                  }
                : null,
            };
          }),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Order Detail GET] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // PUT - Update order status (limited to cancellation for users)
  if (req.method === 'PUT') {
    try {
      const { status } = req.body;

      // Check if order exists and belongs to user
      const existingOrder = await prisma.orders.findFirst({
        where: { 
          id: orderId,
          userId,
        },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      }

      // Users can only cancel pending orders
      if (status === 'cancelled') {
        if (existingOrder.status !== 'pending') {
          return res.status(400).json({ 
            message: 'Hanya pesanan dengan status "menunggu pembayaran" yang dapat dibatalkan' 
          });
        }
      } else {
        return res.status(403).json({ message: 'Anda tidak diizinkan mengubah status pesanan' });
      }

      const updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          order_items: {
            include: {
              produk: {
                select: {
                  id: true,
                  nama: true,
                  gambar: true,
                },
              },
            },
          },
        },
      });

      // Attach user's reviews for the products in the updated order (if any)
      const updatedProductIds = Array.from(new Set(updatedOrder.order_items.map((item) => item.produkId)));
      let updatedUserReviews = [];
      if (updatedProductIds.length > 0) {
        updatedUserReviews = await prisma.reviews.findMany({
          where: {
            userId,
            produkId: { in: updatedProductIds },
          },
          select: {
            id: true,
            produkId: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      const updatedReviewMap = {};
      updatedUserReviews.forEach((r) => {
        updatedReviewMap[r.produkId] = r;
      });

      return res.status(200).json({ 
        order: {
          ...updatedOrder,
          order_items: updatedOrder.order_items.map((item) => {
            const r = updatedReviewMap[item.produkId] || null;
            return {
              ...item,
              userReview: r
                ? {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt.toISOString(),
                    updatedAt: r.updatedAt.toISOString(),
                  }
                : null,
            };
          }),
          createdAt: updatedOrder.createdAt.toISOString(),
          updatedAt: updatedOrder.updatedAt.toISOString(),
        },
        message: 'Pesanan berhasil dibatalkan' 
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Order Detail PUT] Error:', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
