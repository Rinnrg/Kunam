import React from 'react';
import Image from 'next/image';
import styles from './ProductSections.module.scss';

/**
 * Component untuk menampilkan product sections
 * Setiap section bisa memiliki judul, deskripsi, dan gambar opsional
 * 
 * @param {Array} sections - Array of section objects with judul, deskripsi, and optional gambar
 */
export default function ProductSections({ sections }) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className={styles.productSections}>
      <h2 className={styles.sectionTitle}>Product Details</h2>
      
      {sections.map((section, index) => {
        // Normalize to array of images for backward compatibility
        const gambarArray = Array.isArray(section.gambar)
          ? section.gambar
          : (section.gambar ? (typeof section.gambar === 'string' ? [{ url: section.gambar, caption: '' }] : [section.gambar]) : []);

        return (
          <div key={index} className={styles.section}>
            <h3 className={styles.sectionHeading}>{section.judul}</h3>

            <div className={styles.sectionContent}>
              {gambarArray.length > 0 ? (
                <div className={styles.sectionGalleryItems}>
                  {gambarArray.map((g, idx) => (
                    <div key={idx} className={styles.galleryItem}>
                      <div className={styles.itemImage}>
                        <Image src={g.url} alt={g.caption || section.judul} width={96} height={96} style={{ objectFit: 'cover' }} />
                      </div>
                      <div className={styles.itemText}>
                        <p>{g.caption || section.deskripsi || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${styles.sectionDescription}`}>
                  <p>{section.deskripsi}</p>
                </div>
              )}

              {/* If there is a general section description and images exist, display it below the items */}
              {gambarArray.length > 0 && section.deskripsi && (
                <div className={styles.sectionDescriptionBelow}>
                  <p>{section.deskripsi}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
