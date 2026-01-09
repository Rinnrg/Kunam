import { prisma } from '@src/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { active } = req.query;
      
      const where = {};
      
      // Only get active vouchers if specified
      if (active === 'true') {
        where.isActive = true;
        where.endDate = { gte: new Date() };
      }

      const vouchers = await prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ vouchers });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        code,
        name,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        usageLimit,
        startDate,
        endDate,
        isActive,
      } = req.body;

      // Validation
      if (!code || !name || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (discountType !== 'percentage' && discountType !== 'fixed') {
        return res.status(400).json({ error: 'Invalid discount type' });
      }

      if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
      }

      // Check if code already exists
      const existing = await prisma.voucher.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        return res.status(400).json({ error: 'Kode voucher sudah digunakan' });
      }

      const voucher = await prisma.voucher.create({
        data: {
          code: code.toUpperCase(),
          name,
          description,
          discountType,
          discountValue: parseFloat(discountValue),
          minPurchase: parseFloat(minPurchase) || 0,
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive !== false,
        },
      });

      return res.status(201).json({ voucher });
    } catch (error) {
      console.error('Error creating voucher:', error);
      return res.status(500).json({ error: 'Failed to create voucher' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
