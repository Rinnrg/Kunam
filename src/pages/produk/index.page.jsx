/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

import CustomHead from '@src/components/dom/CustomHead';
import ProdukGrid from '@src/pages/produk/components/produkGrid/ProdukGrid';
import prisma from '@src/lib/db';

const seo = {
  title: 'Kunam - Produk',
  description: 'Jelajahi koleksi produk clothing Kunam. Temukan berbagai pilihan pakaian berkualitas dengan desain menarik dan harga terjangkau.',
  keywords: [
    'Kunam Produk',
    'Clothing Store',
    'Fashion Store',
    'Pakaian Pria',
    'Pakaian Wanita',
    'T-Shirt',
    'Hoodie',
    'Jacket',
    'Streetwear',
    'Fashion Indonesia',
    'Online Clothing Store',
    'Toko Baju Online',
  ],
};

function Page({ produk = [], kategori = null, error = null }) {
  const title = kategori ? `Kunam - ${kategori}` : 'Kunam - Produk';
  const description = kategori
    ? `Jelajahi koleksi ${kategori} Kunam. Temukan berbagai pilihan ${kategori} berkualitas dengan desain menarik dan harga terjangkau.`
    : 'Jelajahi koleksi produk clothing Kunam. Temukan berbagai pilihan pakaian berkualitas dengan desain menarik dan harga terjangkau.';

  return (
    <>
      <CustomHead {...seo} title={title} description={description} />
      <ProdukGrid produk={produk} kategori={kategori} error={error} />
    </>
  );
}

export async function getServerSideProps(context) {
  const { kategori } = context.query;

  try {
    const whereClause = kategori ? { kategori } : {};

    console.log('[Produk Page] Fetching products with whereClause:', whereClause);
    console.log('[Produk Page] Database URL exists:', !!process.env.DATABASE_URL);

    const produk = await prisma.produk.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        kategori: true,
        harga: true,
        diskon: true,
        stok: true,
        gambar: true,
        ukuran: true,
        warna: true,
        deskripsi: true,
        video: true,
        produkUnggulan: true,
        urutanTampilan: true,
        tanggalDibuat: true,
        tanggalDiubah: true,
      },
      orderBy: [{ produkUnggulan: 'desc' }, { urutanTampilan: 'asc' }, { tanggalDibuat: 'desc' }],
    });

    console.log(`[Produk Page] Found ${produk.length} products`);

    const serializedProduk = produk.map((item) => ({
      ...item,
      tanggalDibuat: item.tanggalDibuat.toISOString(),
      tanggalDiubah: item.tanggalDiubah.toISOString(),
    }));

    return {
      props: {
        produk: serializedProduk,
        kategori: kategori || null,
      },
    };
  } catch (error) {
    console.error('[Produk Page] Error fetching produk:', error);
    console.error('[Produk Page] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return {
      props: {
        produk: [],
        kategori: kategori || null,
        error: error.message || 'Failed to fetch products',
      },
    };
  }
}

export default Page;
