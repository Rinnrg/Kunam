import { prisma } from '@src/lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const voucher = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        return res.status(404).json({ error: 'Voucher not found' });
      }

      return res.status(200).json({ voucher });
    } catch (error) {
      console.error('Error fetching voucher:', error);
      return res.status(500).json({ error: 'Failed to fetch voucher' });
    }
  }

  if (req.method === 'PUT') {
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

      // Check if voucher exists
      const existing = await prisma.voucher.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Voucher not found' });
      }

      // If code is being changed, check if new code already exists
      if (code && code.toUpperCase() !== existing.code) {
        const codeExists = await prisma.voucher.findUnique({
          where: { code: code.toUpperCase() },
        });

        if (codeExists) {
          return res.status(400).json({ error: 'Kode voucher sudah digunakan' });
        }
      }

      const voucher = await prisma.voucher.update({
        where: { id },
        data: {
          ...(code && { code: code.toUpperCase() }),
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(discountType && { discountType }),
          ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
          ...(minPurchase !== undefined && { minPurchase: parseFloat(minPurchase) }),
          ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
          ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit) : null }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.status(200).json({ voucher });
    } catch (error) {
      console.error('Error updating voucher:', error);
      return res.status(500).json({ error: 'Failed to update voucher' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.voucher.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Voucher deleted successfully' });
    } catch (error) {
      console.error('Error deleting voucher:', error);
      return res.status(500).json({ error: 'Failed to delete voucher' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
