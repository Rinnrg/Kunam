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
    const prisma = (await import('../lib/prisma')).default;

    // Optimized query: Select only needed fields and limit results
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
