import React from 'react';
import styles from './ColorSelector.module.scss';

/**
 * Component untuk memilih warna produk dengan checkbox
 * Menampilkan daftar warna yang umum dengan color preview
 */
export default function ColorSelector({ selectedColors = [], onChange }) {
  // Daftar warna yang tersedia
  const availableColors = [
    { name: 'Hitam', hex: '#000000' },
    { name: 'Putih', hex: '#FFFFFF' },
    { name: 'Merah', hex: '#DC143C' },
    { name: 'Biru', hex: '#1E90FF' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Abu-abu', hex: '#808080' },
    { name: 'Coklat', hex: '#8B4513' },
    { name: 'Hijau', hex: '#228B22' },
    { name: 'Kuning', hex: '#FFD700' },
    { name: 'Pink', hex: '#FF69B4' },
    { name: 'Ungu', hex: '#8B008B' },
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Tosca', hex: '#40E0D0' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Olive', hex: '#808000' },
  ];

  // Handle checkbox change
  const handleColorToggle = (colorName) => {
    let updatedColors;
    if (selectedColors.includes(colorName)) {
      // Remove color
      updatedColors = selectedColors.filter((c) => c !== colorName);
    } else {
      // Add color
      updatedColors = [...selectedColors, colorName];
    }
    onChange(updatedColors);
  };

  return (
    <div className={styles.colorSelector}>
      <div className={styles.colorGrid}>
        {availableColors.map((color) => (
          <label key={color.name} className={styles.colorItem}>
            <input
              type="checkbox"
              checked={selectedColors.includes(color.name)}
              onChange={() => handleColorToggle(color.name)}
              className={styles.checkbox}
            />
            <div className={styles.colorDisplay}>
              <div
                className={styles.colorBox}
                style={{ 
                  backgroundColor: color.hex,
                  border: color.hex === '#FFFFFF' ? '1px solid #ddd' : 'none'
                }}
              />
              <span className={styles.colorName}>{color.name}</span>
            </div>
          </label>
        ))}
      </div>

      {selectedColors.length > 0 && (
        <div className={styles.selectedColors}>
          <strong>Warna terpilih:</strong> {selectedColors.join(', ')}
        </div>
      )}
    </div>
  );
}
