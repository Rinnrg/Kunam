import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" style={{ backgroundColor: '#ffffff' }}>
        <Head>
          <link rel="icon" type="image/svg+xml" href="/logo/icon.svg" />
          <link href="/fonts/NeueHaasDisplayBold.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayLight.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayLightItalic.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayMedium.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayRoman.woff2" as="font" type="font/woff2" />
          <link href="/fonts/NeueHaasDisplayRomanItalic.woff2" as="font" type="font/woff2" />
          
          {/* Mobile theme color - prevent white flash */}
          <meta name="theme-color" content="#ffffff" />
          <meta name="apple-mobile-web-app-status-bar-style" content="white" />
          
          {/* Prevent white flash on page load */}
          <style dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #ffffff !important;
                margin: 0;
                padding: 0;
              }
              body {
                opacity: 1 !important;
              }
              #__next {
                background-color: #ffffff;
                min-height: 100vh;
              }
            `
          }} />
        </Head>
        <body style={{ backgroundColor: '#ffffff', opacity: 1 }}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
