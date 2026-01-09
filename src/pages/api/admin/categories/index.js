import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '@src/lib/prisma'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

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
        const category = product.kategori || 'Uncategorized'
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + 1)
        } else {
          categoryMap.set(category, 1)
        }
      })

      const categories = Array.from(categoryMap.entries()).map(([name, count], index) => ({
        id: index + 1,
        name,
        productCount: count,
      }))

      return res.status(200).json({
        success: true,
        categories,
        total: categories.length,
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return res.status(500).json({ error: 'Failed to fetch categories' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
