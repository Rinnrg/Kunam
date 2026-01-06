/* eslint-disable react/jsx-props-no-spreading */
import Home from '@src/pages/components/home/Index';
import HomeSections from '@src/pages/components/homeSections/Index';
import Quote from '@src/pages/components/quote/Index';
import Produk from '@src/pages/components/produk/Index';
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

function Page({ produk, homeSections }) {
  return (
    <>
      <CustomHead {...seo} />
      <Home />
      <HomeSections sections={homeSections} />
      <Quote />
      <Produk produk={produk} />
    </>
  );
}

export async function getServerSideProps() {
  try {
    const prisma = (await import('../lib/prisma')).default;

    // Fetch products
    const produk = await prisma.produk.findMany({
      where: {
        OR: [
          { produkUnggulan: true },
          { urutanTampilan: { gt: 0 } },
        ],
      },
      select: {
        id: true,
        nama: true,
        kategori: true,
        harga: true,
        diskon: true,
        stok: true,
        gambar: true,
        produkUnggulan: true,
        urutanTampilan: true,
        jumlahTerjual: true,
        tanggalDibuat: true,
        tanggalDiubah: true,
      },
      orderBy: [{ produkUnggulan: 'desc' }, { urutanTampilan: 'asc' }, { tanggalDibuat: 'desc' }],
      take: 20, // Limit to 20 products for homepage
    });

    // Fetch home sections
    const homeSections = await prisma.homeSections.findMany({
      orderBy: {
        urutan: 'asc',
      },
    });

    // Serialize dates for products
    const serializedProduk = produk.map((item) => ({
      ...item,
      tanggalDibuat: item.tanggalDibuat.toISOString(),
      tanggalDiubah: item.tanggalDiubah.toISOString(),
    }));

    // Serialize dates for home sections
    const serializedHomeSections = homeSections.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return {
      props: {
        produk: serializedProduk,
        homeSections: serializedHomeSections,
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error);
    return {
      props: {
        produk: [],
        homeSections: [],
      },
    };
  }
}

export default Page;
