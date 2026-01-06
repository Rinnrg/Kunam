import React, { useState } from 'react';
import styles from './SectionsEditor.module.scss';

/**
 * Component untuk mengedit product sections di admin panel
 * Memungkinkan admin untuk menambah, edit, dan hapus sections
 */
const SectionsEditor = ({ sections = [], onChange }) => {
  const [sectionList, setSectionList] = useState(sections);

  // Tambah section baru
  const handleAddSection = () => {
    const newSection = {
      judul: '',
      deskripsi: '',
      gambar: ''
    };
    const updated = [...sectionList, newSection];
    setSectionList(updated);
    onChange(updated);
  };

  // Update section
  const handleUpdateSection = (index, field, value) => {
    const updated = [...sectionList];
    updated[index][field] = value;
    setSectionList(updated);
    onChange(updated);
  };

  // Hapus section
  const handleRemoveSection = (index) => {
    const updated = sectionList.filter((_, i) => i !== index);
    setSectionList(updated);
    onChange(updated);
  };

  // Pindahkan section ke atas
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...sectionList];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setSectionList(updated);
    onChange(updated);
  };

  // Pindahkan section ke bawah
  const handleMoveDown = (index) => {
    if (index === sectionList.length - 1) return;
    const updated = [...sectionList];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setSectionList(updated);
    onChange(updated);
  };

  return (
    <div className={styles.sectionsEditor}>
      <div className={styles.header}>
        <h3>Product Sections</h3>
        <button 
          type="button"
          onClick={handleAddSection} 
          className={styles.addButton}
        >
          + Tambah Section
        </button>
      </div>

      {sectionList.length === 0 && (
        <div className={styles.emptyState}>
          <p>Belum ada section. Klik "Tambah Section" untuk menambahkan.</p>
        </div>
      )}

      {sectionList.map((section, index) => (
        <div key={index} className={styles.sectionItem}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>Section {index + 1}</span>
            <div className={styles.sectionActions}>
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className={styles.moveButton}
                title="Pindah ke atas"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === sectionList.length - 1}
                className={styles.moveButton}
                title="Pindah ke bawah"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSection(index)}
                className={styles.removeButton}
                title="Hapus section"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.sectionForm}>
            <div className={styles.formGroup}>
              <label>Judul Section *</label>
              <input
                type="text"
                value={section.judul}
                onChange={(e) => handleUpdateSection(index, 'judul', e.target.value)}
                placeholder="Contoh: Features, Material, Care Instructions"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Deskripsi *</label>
              <textarea
                value={section.deskripsi}
                onChange={(e) => handleUpdateSection(index, 'deskripsi', e.target.value)}
                placeholder="Masukkan deskripsi detail untuk section ini..."
                rows={4}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Gambar (Opsional)</label>
              <input
                type="text"
                value={section.gambar || ''}
                onChange={(e) => handleUpdateSection(index, 'gambar', e.target.value)}
                placeholder="/uploads/image.jpg atau URL gambar"
              />
              <small>Kosongkan jika tidak ingin menampilkan gambar</small>
              
              {section.gambar && (
                <div className={styles.imagePreview}>
                  <img src={section.gambar} alt="Preview" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SectionsEditor;
