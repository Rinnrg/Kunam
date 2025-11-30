import AppearByWords from '@src/components/animationComponents/appearBywords/Index';
import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import ProdukGrid from '@src/pages/produk/components/produkGrid/ProdukGrid';
import clsx from 'clsx';
import styles from '@src/pages/components/produk/styles/produk.module.scss';

function Produk({ produk = [] }) {
  // Show first 4 products on homepage or featured products
  const featuredProduk = produk
    .filter((p) => p.produkUnggulan)
    .slice(0, 4)
    .concat(produk.filter((p) => !p.produkUnggulan))
    .slice(0, 4);

  return (
    <>
      <section className={clsx(styles.titleContainer, 'layout-grid-inner')}>
        <h1 className={clsx(styles.title, 'h1')}>
          <AppearByWords>Koleksi Terbaru</AppearByWords>
        </h1>
      </section>
      <section className={clsx(styles.root, 'layout-block-inner')}>
        <ProdukGrid produk={featuredProduk} />
        <div className={styles.buttonContainer}>
          <ButtonLink href="/produk" label="LIHAT SEMUA PRODUK" />
        </div>
      </section>
    </>
  );
}

export default Produk;
