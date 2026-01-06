import { getServerSession } from 'next-auth';
import { authOptions } from '@src/pages/api/auth/[...nextauth].page';
import prisma from '@src/lib/prisma';
import { snap, generateOrderId, createTransactionParams } from '@src/lib/midtrans';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items, customerDetails } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    if (!customerDetails?.name || !customerDetails?.email || !customerDetails?.phone) {
      return res.status(400).json({ error: 'Customer details are required' });
    }

    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch all products at once
    const productIds = items.map(item => item.produkId);
    const products = await prisma.produk.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    // Calculate total amount from cart items
    let totalAmount = 0;
    const orderItems = [];

    items.forEach((item) => {
      const produk = productMap[item.produkId];
      if (!produk) {
        throw new Error(`Product ${item.produkId} not found`);
      }

      const price = produk.diskon > 0 
        ? Math.round(produk.harga * (1 - produk.diskon / 100))
        : produk.harga;

      totalAmount += price * item.quantity;
      orderItems.push({
        produkId: item.produkId,
        quantity: item.quantity,
        price,
        ukuran: item.ukuran,
        warna: item.warna,
        produk: {
          nama: produk.nama,
          gambar: produk.gambar,
        },
      });
    });

    // Generate unique order number
    const orderNumber = generateOrderId();

    // Create order in database
    const order = await prisma.orders.create({
      data: {
        userId: user.id,
        orderNumber,
        status: 'pending',
        totalAmount,
        paymentStatus: 'pending',
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        order_items: {
          create: orderItems.map((item) => ({
            produkId: item.produkId,
            quantity: item.quantity,
            price: item.price,
            ukuran: item.ukuran,
            warna: item.warna,
          })),
        },
      },
      include: {
        order_items: {
          include: {
            produk: true,
          },
        },
      },
    });

    // Create transaction params for Midtrans
    const transactionParams = createTransactionParams(order, customerDetails, order.order_items);

    console.log('Creating Midtrans transaction with params:', JSON.stringify(transactionParams, null, 2));
    console.log('Server Key:', process.env.MIDTRANS_SERVER_KEY ? 'Set' : 'NOT SET');
    console.log('Client Key:', process.env.MIDTRANS_CLIENT_KEY ? 'Set' : 'NOT SET');

    // Create Snap token
    let snapToken;
    try {
      snapToken = await snap.createTransaction(transactionParams);
      console.log('Snap token created:', snapToken);
    } catch (midtransError) {
      console.error('Midtrans error:', midtransError);
      console.error('Midtrans error message:', midtransError.message);
      console.error('Midtrans API response:', midtransError.ApiResponse);
      
      // Delete the order if Midtrans fails
      await prisma.orders.delete({ where: { id: order.id } });
      
      return res.status(500).json({ 
        error: 'Failed to create Midtrans transaction',
        details: midtransError.message || midtransError.ApiResponse?.error_messages?.join(', '),
      });
    }

    // Update order with snap token
    await prisma.orders.update({
      where: { id: order.id },
      data: { snapToken: snapToken.token },
    });

    // Remove items from cart after creating order
    const cartDeletePromises = items.map((item) => 
      prisma.carts.deleteMany({
        where: {
          userId: user.id,
          produkId: item.produkId,
          ukuran: item.ukuran,
          warna: item.warna,
        },
      })
    );
    await Promise.all(cartDeletePromises);

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.order_items,
      },
      snapToken: snapToken.token,
      redirectUrl: snapToken.redirect_url,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
}
