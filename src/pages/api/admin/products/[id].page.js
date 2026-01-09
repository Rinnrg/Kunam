import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth].page';
import { executePrismaQuery } from '@src/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || session.user?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await executePrismaQuery(async (prisma) => {
        return await prisma.produk.findUnique({
          where: { id },
        });
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json({ product });
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        nama,
        deskripsi,
        kategori,
        harga,
        diskon,
        stok,
        ukuran,
        warna,
        gambar,
        thumbnail,
        sections,
        video,
        produkUnggulan,
      } = req.body;

      // Build update data object
      const updateData = {};
      
      if (nama !== undefined) updateData.nama = nama;
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
      if (kategori !== undefined) updateData.kategori = kategori;
      if (harga !== undefined) updateData.harga = parseFloat(harga);
      if (diskon !== undefined) updateData.diskon = parseFloat(diskon);
      if (stok !== undefined) updateData.stok = parseInt(stok, 10);
      if (ukuran !== undefined) updateData.ukuran = ukuran;
      if (warna !== undefined) updateData.warna = warna;
      if (gambar !== undefined) updateData.gambar = gambar;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (sections !== undefined) updateData.sections = sections;
      if (video !== undefined) updateData.video = video;
      if (produkUnggulan !== undefined) updateData.produkUnggulan = produkUnggulan;

      const product = await executePrismaQuery(async (prisma) => {
        return await prisma.produk.update({
          where: { id },
          data: updateData,
        });
      });

      return res.status(200).json({ 
        success: true,
        message: 'Product updated successfully',
        product,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await executePrismaQuery(async (prisma) => {
        return await prisma.produk.delete({
          where: { id },
        });
      });

      return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
