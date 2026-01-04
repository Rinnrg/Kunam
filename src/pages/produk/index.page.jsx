/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

import CustomHead from '@src/components/dom/CustomHead';
import ProdukGrid from '@src/pages/produk/components/produkGrid/ProdukGrid';
import prisma from '../../lib/prisma';

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

function Page({ produk = [], kategori = null }) {
  const title = kategori ? `Kunam - ${kategori}` : 'Kunam - Produk';
  const description = kategori
    ? `Jelajahi koleksi ${kategori} Kunam. Temukan berbagai pilihan ${kategori} berkualitas dengan desain menarik dan harga terjangkau.`
    : 'Jelajahi koleksi produk clothing Kunam. Temukan berbagai pilihan pakaian berkualitas dengan desain menarik dan harga terjangkau.';

  return (
    <>
      <CustomHead {...seo} title={title} description={description} />
      <ProdukGrid produk={produk} kategori={kategori} />
    </>
  );
}

export async function getServerSideProps(context) {
  const { kategori } = context.query;

  try {
    const whereClause = kategori ? { kategori } : {};

    // Optimized query with field selection
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
        produkUnggulan: true,
        urutanTampilan: true,
        tanggalDibuat: true,
        tanggalDiubah: true,
      },
      orderBy: [{ produkUnggulan: 'desc' }, { urutanTampilan: 'asc' }, { tanggalDibuat: 'desc' }],
    });

    // Serialize dates
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
    // Return empty array on error to prevent page crash
    return {
      props: {
        produk: [],
        kategori: kategori || null,
      },
    };
  }
}

export default Page;
