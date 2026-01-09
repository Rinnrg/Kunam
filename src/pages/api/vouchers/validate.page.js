import { prisma } from '@src/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, totalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Kode voucher wajib diisi' });
    }

    // Find voucher by code
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Kode voucher tidak valid' });
    }

    // Check if voucher is active
    if (!voucher.isActive) {
      return res.status(400).json({ error: 'Voucher tidak aktif' });
    }

    // Check date validity
    const now = new Date();
    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({ error: 'Voucher belum dapat digunakan' });
    }

    if (now > new Date(voucher.endDate)) {
      return res.status(400).json({ error: 'Voucher sudah kadaluarsa' });
    }

    // Check usage limit
    if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
      return res.status(400).json({ error: 'Voucher sudah mencapai batas penggunaan' });
    }

    // Check minimum purchase
    if (totalAmount < voucher.minPurchase) {
      return res.status(400).json({
        error: `Minimal pembelian Rp ${voucher.minPurchase.toLocaleString('id-ID')} untuk menggunakan voucher ini`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (totalAmount * voucher.discountValue) / 100;
      
      // Apply max discount if set
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    return res.status(200).json({
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscount: voucher.maxDiscount,
      },
      discountAmount,
      finalAmount: totalAmount - discountAmount,
    });
  } catch (error) {
    console.error('Error validating voucher:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memvalidasi voucher' });
  }
}
