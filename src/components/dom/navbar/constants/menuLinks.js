// Function to generate menu links with dynamic categories
export const getMenuLinks = (categories = []) => {
  return [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Product',
      href: '/produk',
      submenu: categories.map((cat) => ({
        title: cat.name,
        href: cat.href,
      })),
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
          href: 'https://www.instagram.com/kunam.officialshop/',
          external: true,
        },
      ],
    },
    {
      title: 'Contact',
      href: undefined,
    },
  ];
};

// Default menu links (fallback if categories not loaded yet)
const menuLinks = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Product',
    href: '/produk',
    submenu: [],
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
        href: 'https://www.instagram.com/kunam.officialshop/',
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
