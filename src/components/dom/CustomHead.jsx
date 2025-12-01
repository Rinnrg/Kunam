import NextHead from 'next/head';
import { NextSeo } from 'next-seo';
import PropTypes from 'prop-types';

const SITE_URL = 'https://kunam-id.vercel.app';
const OG_IMAGE = `${SITE_URL}/og.png`;

const getSchema = () => ({
  '@context': 'http://schema.org',
  '@type': 'Organization',
  name: 'Kunam',
  description: 'Kunam - Fashion & Lifestyle Brand',
  url: SITE_URL,
  image: OG_IMAGE,
  email: 'mailto:info@kunam.com',
  sameAs: ['https://www.instagram.com/kunam/', 'https://www.facebook.com/kunam', 'https://twitter.com/kunam'],
});

function CustomHead({ title = '', description, keywords }) {
  return (
    <>
      <NextHead>
        {/* General Meta Tags */}
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta httpEquiv="x-dns-prefetch-control" content="off" />
        <meta name="robots" content={process.env.NODE_ENV !== 'development' ? 'index,follow' : 'noindex,nofollow'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="keywords" content={keywords && keywords.length ? keywords.join(',') : keywords} />
        <meta name="author" content="Kunam" />
        <meta name="referrer" content="no-referrer" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="US" />

        {/* Canonical and Title */}
        <link rel="canonical" href={SITE_URL} />
        <title>{title}</title>

        {/* OpenGraph Meta Tags */}
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={SITE_URL} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/logo/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/icon.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/icon.svg" />
        <link rel="shortcut icon" href="/logo/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/logo/icon.svg" color="#ffffff" />
        <meta name="msapplication-TileColor" content="#28282b" />
        <meta name="theme-color" content="#28282b" />

        {/* Schema */}
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }} />
      </NextHead>
      <NextSeo title={title} description={description} />
    </>
  );
}

CustomHead.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  keywords: PropTypes.arrayOf(PropTypes.string),
};

CustomHead.defaultProps = {
  keywords: [],
};

export default CustomHead;
