import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get unique categories from products
      const products = await prisma.produk.findMany({
        select: {
          kategori: true,
        },
      })

      // Get unique category names and count products
      const categoryMap = new Map()
      
      products.forEach((product) => {
        const category = product.kategori
        if (category && category.trim() !== '') {
          if (categoryMap.has(category)) {
            categoryMap.set(category, categoryMap.get(category) + 1)
          } else {
            categoryMap.set(category, 1)
          }
        }
      })

      const categories = Array.from(categoryMap.entries())
        .filter(([, count]) => count > 0) // Only categories with products
        .map(([name]) => ({
          name,
          href: `/produk?kategori=${encodeURIComponent(name)}`,
        }))

      return res.status(200).json({
        success: true,
        categories,
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
