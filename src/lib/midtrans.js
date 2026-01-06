import midtransClient from 'midtrans-client';

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Create Core API instance for checking transaction status
export const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Helper function to generate unique order ID
export function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KNM-${timestamp}-${random}`;
}

// Helper function to create transaction parameter
export function createTransactionParams(order, customerDetails, items) {
  return {
    transaction_details: {
      order_id: order.orderNumber,
      gross_amount: Math.round(order.totalAmount),
    },
    customer_details: {
      first_name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
    },
    item_details: items.map((item) => ({
      id: item.produkId,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.produk?.nama || `Produk ${item.produkId}`,
    })),
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/pembayaran/sukses`,
      error: `${process.env.NEXTAUTH_URL}/pembayaran/gagal`,
      pending: `${process.env.NEXTAUTH_URL}/pembayaran/pending`,
    },
  };
}

// Map Midtrans status to order status
export function mapPaymentStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'accept') {
      return { status: 'processing', paymentStatus: 'settlement' };
    }
    return { status: 'pending', paymentStatus: 'pending' };
  }
  
  if (transactionStatus === 'settlement') {
    return { status: 'processing', paymentStatus: 'settlement' };
  }
  
  if (transactionStatus === 'pending') {
    return { status: 'pending', paymentStatus: 'pending' };
  }
  
  if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
    return { status: 'cancelled', paymentStatus: transactionStatus };
  }
  
  return { status: 'pending', paymentStatus: 'pending' };
}
