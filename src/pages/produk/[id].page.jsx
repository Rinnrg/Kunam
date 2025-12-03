/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { useMemo } from 'react';
import Image from 'next/image';
import CustomHead from '@src/components/dom/CustomHead';
import styles from '@src/pages/produk/produkDetail.module.scss';
import prisma from '../../lib/prisma';

function Page({ produk }) {
  const currentProduk = produk;

  const seo = useMemo(
    () => ({
      title: currentProduk ? `Kunam - ${currentProduk.nama}` : 'Kunam - Produk Tidak Ditemukan',
      description: currentProduk
        ? `${currentProduk.nama} - ${currentProduk.kategori}. ${currentProduk.deskripsi || 'Produk clothing berkualitas dari Kunam.'} Harga: Rp ${currentProduk.harga.toLocaleString('id-ID')}`
        : 'Produk tidak ditemukan',
      keywords: currentProduk
        ? [
            `${currentProduk.nama}`,
            `${currentProduk.kategori}`,
            `Kunam ${currentProduk.kategori}`,
            `Beli ${currentProduk.nama}`,
            `${currentProduk.kategori} Online`,
            'Kunam Clothing',
            'Fashion Indonesia',
          ]
        : [],
    }),
    [currentProduk],
  );

  if (!currentProduk) {
    return <div>Produk tidak ditemukan</div>;
  }

  return (
    <>
      <CustomHead {...seo} />
      <main className={styles.container}>
        {/* Header with Back Button and Title */}
        <div className={styles.headerSection}>
          <button 
            type="button" 
            onClick={() => window.history.back()} 
            className={styles.backButton}
            aria-label="Kembali"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={styles.projectTitle}>{currentProduk.nama}</h1>
        </div>

        {/* Hero Product Images */}
        <div className={styles.heroMockup}>
          <div className={styles.mockupContainer}>
            {currentProduk.gambar && (
              <Image src={Array.isArray(currentProduk.gambar) ? currentProduk.gambar[0] : currentProduk.gambar} alt={currentProduk.nama} fill priority className={styles.mockupImage} />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentWrapper}>
          <div className={styles.contentInner}>
            {/* Product Info */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.descriptionTitle}>
                {currentProduk.nama} - {currentProduk.kategori}
              </h2>
              <div className={styles.priceSection}>
                <div className={styles.priceWrapper}>
                  {currentProduk.diskon > 0 ? (
                    <>
                      <p className={styles.priceOriginal}>Rp {currentProduk.harga.toLocaleString('id-ID')}</p>
                      <p className={styles.price}>Rp {(currentProduk.harga * (1 - currentProduk.diskon / 100)).toLocaleString('id-ID')}</p>
                      <span className={styles.discountBadge}>{currentProduk.diskon}% OFF</span>
                    </>
                  ) : (
                    <p className={styles.price}>Rp {currentProduk.harga.toLocaleString('id-ID')}</p>
                  )}
                </div>
                <p className={styles.stock}>Stok: {currentProduk.stok}</p>
              </div>
              {currentProduk.deskripsi && (
                <div className={styles.descriptionWrapper}>
                  <h3 className={styles.descriptionLabel}>Deskripsi Produk</h3>
                  <p className={styles.description}>{currentProduk.deskripsi}</p>
                </div>
              )}

              {currentProduk.ukuran && currentProduk.ukuran.length > 0 && (
                <div className={styles.sizeSection}>
                  <p className={styles.label}>Ukuran tersedia:</p>
                  <div className={styles.sizes}>
                    {currentProduk.ukuran.map((size) => (
                      <span key={size} className={styles.sizeTag}>
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentProduk.warna && currentProduk.warna.length > 0 && (
                <div className={styles.colorSection}>
                  <p className={styles.label}>Warna tersedia:</p>
                  <div className={styles.colors}>
                    {currentProduk.warna.map((color) => (
                      <span key={color} className={styles.colorTag}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
              <div className={styles.categoryTag}>
                <span className={styles.categoryLabel}>{currentProduk.kategori}</span>
                <p className={styles.categoryInfo}>Kunam Clothing - Premium Quality</p>
              </div>
              <button type="button" className={styles.ctaButton}>
                BELI SEKARANG
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  try {
    const produk = await prisma.produk.findMany();
    const paths = produk.map((item) => ({ params: { id: item.id } }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getStaticPaths:', error);
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps(context) {
  const { params } = context;

  try {
    const produk = await prisma.produk.findUnique({
      where: { id: params.id },
    });

    if (!produk) {
      return { notFound: true };
    }

    return {
      props: {
        produk: JSON.parse(JSON.stringify(produk)),
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}

export default Page;
