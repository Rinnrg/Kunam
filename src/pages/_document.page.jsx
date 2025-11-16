import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#28282b" />
          <link href="/fonts/NeueHaasDisplayBold.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayLight.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayLightItalic.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayMedium.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayRoman.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayRomanItalic.woff2" as="font" type="font/woff2" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
