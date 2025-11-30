/* eslint-disable react/jsx-props-no-spreading */

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
