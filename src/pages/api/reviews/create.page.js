import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth].page';
import prisma from '@src/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { produkId, orderId, rating, comment } = req.body;

    console.log('[Create Review] Request body:', { produkId, orderId, rating, comment });

    // Validation
    if (!produkId || !orderId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({ message: 'Comment must be at least 10 characters' });
    }

    // Ensure produkId is a string
    const produkIdStr = String(produkId);
    const orderIdNum = parseInt(orderId, 10);

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that user owns the order
    const order = await prisma.orders.findFirst({
      where: {
        id: orderIdNum,
        userId: user.id,
      },
      include: {
        order_items: {
          where: {
            produkId: produkIdStr,
          },
        },
      },
    });

    if (!order) {
      return res.status(403).json({ message: 'Order not found or does not belong to you' });
    }

    if (order.order_items.length === 0) {
      return res.status(403).json({ message: 'Product not found in this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered' && order.paymentStatus !== 'settlement') {
      return res.status(400).json({ 
        message: 'You can only review products from delivered and paid orders' 
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.reviews.findFirst({
      where: {
        userId: user.id,
        produkId: produkIdStr,
      },
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    const review = await prisma.reviews.create({
      data: {
        userId: user.id,
        produkId: produkIdStr,
        rating: parseInt(rating, 10),
        comment: comment.trim(),
      },
      include: {
        users: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Update product rating and total reviews
    const allReviews = await prisma.reviews.findMany({
      where: { produkId: produkIdStr },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await prisma.produk.update({
      where: { id: produkIdStr },
      data: {
        rating: averageRating,
        totalReviews: totalReviews,
      },
    });

    return res.status(201).json({
      message: 'Review created successfully',
      review: {
        ...review,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Create Review] Error:', error);
    console.error('[Create Review] Error Message:', error.message);
    console.error('[Create Review] Error Stack:', error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
