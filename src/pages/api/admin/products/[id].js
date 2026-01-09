import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '@src/lib/prisma'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const product = await prisma.produk.findUnique({
        where: { id: id },
      })

      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      return res.status(200).json({
        success: true,
        product,
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      return res.status(500).json({ error: 'Failed to fetch product' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        nama,
        deskripsi,
        harga,
        diskon,
        stok,
        kategori,
        gambar,
        thumbnail,
        ukuran,
        warna,
        produkUnggulan,
      } = req.body

      // Build update data
      const updateData = {}
      
      if (nama !== undefined) updateData.nama = nama
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi
      if (harga !== undefined) updateData.harga = parseFloat(harga)
      if (diskon !== undefined) updateData.diskon = parseFloat(diskon)
      if (stok !== undefined) updateData.stok = parseInt(stok, 10)
      if (kategori !== undefined) updateData.kategori = kategori
      if (gambar !== undefined) updateData.gambar = gambar
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail
      if (ukuran !== undefined) updateData.ukuran = ukuran
      if (warna !== undefined) updateData.warna = warna
      if (produkUnggulan !== undefined) updateData.produkUnggulan = produkUnggulan

      const product = await prisma.produk.update({
        where: { id: id },
        data: updateData,
      })

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product,
      })
    } catch (error) {
      console.error('Error updating product:', error)
      return res.status(500).json({ error: 'Failed to update product' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete product
      await prisma.produk.delete({
        where: { id: id },
      })

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      return res.status(500).json({ error: 'Failed to delete product' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
