/* eslint-disable react/jsx-props-no-spreading */
import Home from '@src/pages/components/home/Index';
import About from '@src/pages/components/about/Index';
import Quote from '@src/pages/components/quote/Index';
import Produk from '@src/pages/components/produk/Index';
import Clients from '@src/pages/components/clients/Index';
import CustomHead from '@src/components/dom/CustomHead';

const seo = {
  title: 'Kunam - Clothing Store',
  description: 'Kunam adalah toko clothing online yang menyediakan berbagai produk fashion berkualitas tinggi. Temukan koleksi pakaian terbaru dengan desain menarik dan harga terjangkau.',
  keywords: [
    'Kunam',
    'Clothing Store',
    'Fashion',
    'Online Shop',
    'Toko Baju Online',
    'Pakaian',
    'Fashion Indonesia',
    'Streetwear',
    'T-Shirt',
    'Hoodie',
    'Jacket',
    'Pakaian Pria',
    'Pakaian Wanita',
    'Fashion Modern',
    'Baju Keren',
    'Toko Fashion',
    'E-commerce',
    'Belanja Online',
  ],
};

function Page({ produk }) {
  return (
    <>
      <CustomHead {...seo} />
      <Home />
      <About />
      <Clients />
      <Quote />
      <Produk produk={produk} />
    </>
  );
}

export async function getServerSideProps() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const produk = await prisma.produk.findMany({
      orderBy: [{ produkUnggulan: 'desc' }, { urutanTampilan: 'asc' }, { tanggalDibuat: 'desc' }],
    });

    await prisma.$disconnect();

    // Serialize dates
    const serializedProduk = produk.map((item) => ({
      ...item,
      tanggalDibuat: item.tanggalDibuat.toISOString(),
      tanggalDiupdate: item.tanggalDiupdate.toISOString(),
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
