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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/produk`);
    const produk = await res.json();

    return {
      props: {
        produk: produk || [],
      },
    };
  } catch (error) {
    return {
      props: {
        produk: [],
      },
    };
  }
}

export default Page;
