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

        const imageUrl = gambarArray.length > 0 ? (gambarArray[0].url || null) : null;
        const imageCaption = gambarArray.length > 0 ? (gambarArray[0].caption || null) : null;

        return (
          <div key={index} className={styles.section}>
            <h3 className={styles.sectionHeading}>{section.judul}</h3>

            <div className={styles.sectionContent}>
              {imageUrl && (
                <div className={styles.sectionImage}>
                  <Image
                    src={imageUrl}
                    alt={section.judul}
                    width={300}
                    height={200}
                    objectFit="cover"
                    className={styles.image}
                  />
                </div>
              )}

              <div className={`${styles.sectionDescription} ${imageUrl ? styles.withImage : ''}`}>
                {/* Image caption (appears to the right of the image) */}
                {imageCaption && (
                  <div className={styles.imageCaption}>{imageCaption}</div>
                )}

                <p>{section.deskripsi}</p>

                {/* Thumbnails if there are multiple images in this section */}
                {gambarArray.length > 1 && (
                  <div className={styles.sectionGalleryThumbs}>
                    {gambarArray.map((g, idx) => (
                      <div key={idx} className={styles.sectionThumb}>
                        <Image src={g.url} alt={`thumb-${idx}`} width={80} height={60} style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
