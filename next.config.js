/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['page.jsx', 'page.js'],
  trailingSlash: false,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: false, // Recommended for the `pages` directory, default in `app`.

  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  webpack(config, { isServer }) {
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   '@': path.resolve(__dirname),
    //   '@src/': path.resolve(__dirname, 'src'),
    //   '@app/': path.resolve(__dirname, 'app'),
    // };
    if (!isServer) {
      // We're in the browser build, so we can safely exclude the sharp module
      config.externals.push('sharp');
    }
    // shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
    {
      source: '/404',
      destination: '/',
      permanent: true,
    },
  ],
};

module.exports = nextConfig;
