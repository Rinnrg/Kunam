/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { useState, useMemo } from 'react';
import clsx from 'clsx';
import styles from './ProdukSidebar.module.scss';

function ProdukSidebar({ 
  categories = [], 
  selectedKategori = '', 
  onKategoriChange,
  priceRange = { min: 0, max: Infinity },
  onPriceRangeChange,
}) {
  const [expandedSections, setExpandedSections] = useState({
    kategori: true,
    harga: true,
  });

  const priceRanges = useMemo(() => [
    { label: 'Semua Harga', min: 0, max: Infinity },
    { label: 'Di bawah Rp 100.000', min: 0, max: 100000 },
    { label: 'Rp 100.000 - Rp 200.000', min: 100000, max: 200000 },
    { label: 'Rp 200.000 - Rp 300.000', min: 200000, max: 300000 },
    { label: 'Rp 300.000 - Rp 500.000', min: 300000, max: 500000 },
    { label: 'Di atas Rp 500.000', min: 500000, max: Infinity },
  ], []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className={styles.sidebar}>
      {/* Kategori */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection('kategori')}
        >
          <span>Kategori</span>
          <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.kategori })}>
            ▼
          </span>
        </button>
        <div className={clsx(styles.sectionContent, { [styles.expanded]: expandedSections.kategori })}>
          <ul className={styles.categoryList}>
            <li>
              <button
                type="button"
                className={clsx(styles.categoryItem, { [styles.active]: selectedKategori === '' })}
                onClick={() => onKategoriChange('')}
              >
                Semua Kategori
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  className={clsx(styles.categoryItem, { [styles.active]: selectedKategori === cat })}
                  onClick={() => onKategoriChange(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Harga */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => toggleSection('harga')}
        >
          <span>Harga</span>
          <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.harga })}>
            ▼
          </span>
        </button>
        <div className={clsx(styles.sectionContent, { [styles.expanded]: expandedSections.harga })}>
          <ul className={styles.priceList}>
            {priceRanges.map((range, index) => (
              <li key={index}>
                <button
                  type="button"
                  className={clsx(styles.priceItem, { 
                    [styles.active]: priceRange.min === range.min && priceRange.max === range.max 
                  })}
                  onClick={() => onPriceRangeChange(range)}
                >
                  {range.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default ProdukSidebar;
