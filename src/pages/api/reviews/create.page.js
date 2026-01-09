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
        id: parseInt(orderId, 10),
        userId: user.id,
      },
      include: {
        order_items: {
          where: {
            produkId: parseInt(produkId, 10),
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

    // Check if user already reviewed this product from this order
    const existingReview = await prisma.reviews.findFirst({
      where: {
        userId: user.id,
        produkId: parseInt(produkId, 10),
        orderId: parseInt(orderId, 10),
      },
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    const review = await prisma.reviews.create({
      data: {
        userId: user.id,
        produkId: parseInt(produkId, 10),
        orderId: parseInt(orderId, 10),
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

    return res.status(201).json({
      message: 'Review created successfully',
      review: {
        ...review,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Create Review] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
