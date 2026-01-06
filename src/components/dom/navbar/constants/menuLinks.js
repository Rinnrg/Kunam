const menuLinks = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Product',
    href: '/produk',
    submenu: [
      {
        title: 'T-Shirt',
        href: '/produk?kategori=T-Shirt',
      },
      {
        title: 'Hoodie',
        href: '/produk?kategori=Hoodie',
      },
      {
        title: 'Jacket',
        href: '/produk?kategori=Jacket',
      },
      {
        title: 'Pants',
        href: '/produk?kategori=Pants',
      },
      {
        title: 'Shorts',
        href: '/produk?kategori=Shorts',
      },
      {
        title: 'Accessories',
        href: '/produk?kategori=Accessories',
      },
    ],
  },
  {
    title: 'Platform',
    href: undefined,
    submenu: [
      {
        title: 'Shopee',
        href: 'https://shopee.co.id/',
        external: true,
      },
      {
        title: 'Instagram',
        href: 'https://www.instagram.com/',
        external: true,
      },
    ],
  },
  {
    title: 'Contact',
    href: undefined,
  },
];
export default menuLinks;
