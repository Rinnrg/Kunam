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
      
      {sections.map((section, index) => (
        <div key={index} className={styles.section}>
          <h3 className={styles.sectionHeading}>{section.judul}</h3>
          
          <div className={styles.sectionContent}>
            {section.gambar && (
              <div className={styles.sectionImage}>
                <Image
                  src={section.gambar}
                  alt={section.judul}
                  width={300}
                  height={200}
                  objectFit="cover"
                  className={styles.image}
                />
              </div>
            )}
            
            <div className={`${styles.sectionDescription} ${section.gambar ? styles.withImage : ''}`}>
              <p>{section.deskripsi}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
