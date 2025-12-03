import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './styles/produkGrid.module.scss';

function ProdukGrid({ produk = [] }) {
  if (!produk || produk.length === 0) {
    return (
      <section className={styles.root}>
        <div className={styles.gridContainer}>
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>Belum ada produk tersedia.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.gridContainer}>
        {produk.map((item) => (
          <Link key={item.id} href={`/produk/${item.id}`} className={styles.projectCard} scroll={false} aria-label={`View ${item.nama}`}>
            <div className={styles.cardHeader}>
              <h2 className={clsx(styles.projectTitle, 'h2')}>{item.nama}</h2>
            </div>

            <div className={styles.imageContainer}>
              {item.gambar && <Image src={Array.isArray(item.gambar) ? item.gambar[0] : item.gambar} alt={item.nama} fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.projectImage} />}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.produkInfo}>
                <span className={styles.kategoriLabel}>{item.kategori}</span>
                <div className={styles.priceContainer}>
                  {item.diskon > 0 ? (
                    <>
                      <span className={styles.hargaAsli}>Rp {item.harga.toLocaleString('id-ID')}</span>
                      <span className={styles.harga}>Rp {(item.harga * (1 - item.diskon / 100)).toLocaleString('id-ID')}</span>
                      <span className={styles.diskonBadge}>-{item.diskon}%</span>
                    </>
                  ) : (
                    <span className={styles.harga}>Rp {item.harga.toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
              <button type="button" className={styles.viewButton}>
                <span>LIHAT</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ProdukGrid;
