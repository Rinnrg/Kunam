/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

import CustomHead from '@src/components/dom/CustomHead';
import ProdukGrid from '@src/pages/produk/components/produkGrid/ProdukGrid';

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

function Page({ produk }) {
  return (
    <>
      <CustomHead {...seo} />
      <ProdukGrid produk={produk} />
    </>
  );
}

export async function getServerSideProps() {
  try {
    const prisma = await import('../../../lib/prisma').then((mod) => mod.default);

    const produk = await prisma.produk.findMany({
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
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching produk:', error);
    return {
      props: {
        produk: [],
      },
    };
  }
}

export default Page;
