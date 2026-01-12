import React, { useState } from 'react';
import Image from 'next/image';
import styles from './SectionsEditor.module.scss';
import { compressImageFile } from '@src/lib/image-utils';
import ImageCropDialog from '@src/components/admin/ImageCropDialog';

/**
 * Component untuk mengedit product sections di admin panel
 * Memungkinkan admin untuk menambah, edit, dan hapus sections
 */
export default function SectionsEditor({ sections = [], onChange }) {
  // Normalize incoming sections: turn string/obj gambar into array of { url, caption }
  const normalized = (sections || []).map((s) => ({
    ...s,
    gambar: (() => {
      if (!s.gambar) return [];
      if (typeof s.gambar === 'string') return [{ url: s.gambar, caption: '' }];
      if (Array.isArray(s.gambar)) return s.gambar.map((g) => (typeof g === 'string' ? { url: g, caption: '' } : { url: g.url || g, caption: g.caption || '' }));
      // object
      return [{ url: s.gambar.url || s.gambar, caption: s.gambar.caption || '' }];
    })(),
  }));

  const [sectionList, setSectionList] = useState(normalized);
  const [sectionCropDialog, setSectionCropDialog] = useState({ isOpen: false, sectionIndex: null, imageIndex: null, src: null });

  // Tambah section baru
  const handleAddSection = () => {
    const newSection = {
      judul: '',
      deskripsi: '',
      gambar: null,
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

  // Upload images for a section (multiple files)
  const handleUploadImages = async (sectionIndex, fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const files = Array.from(fileList);
      const processed = await Promise.all(files.map(async (file) => {
        const compressed = await compressImageFile(file);
        return { url: URL.createObjectURL(compressed), file: compressed, isNew: true, caption: '' };
      }));

      const updated = [...sectionList];
      updated[sectionIndex].gambar = [...(updated[sectionIndex].gambar || []), ...processed];
      setSectionList(updated);
      onChange(updated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Gagal mengupload/kompres gambar:', err);
    }
  };

  const handleOpenSectionCrop = (sectionIndex, imageIndex) => {
    const img = sectionList[sectionIndex]?.gambar?.[imageIndex]?.url;
    if (!img) return;
    setSectionCropDialog({ isOpen: true, sectionIndex, imageIndex, src: img });
  };

  const handleSectionCropDone = async (blob) => {
    const { sectionIndex, imageIndex } = sectionCropDialog;
    if (sectionIndex === null || sectionIndex === undefined) return;

    const original = sectionList[sectionIndex]?.gambar?.[imageIndex];
    const baseName = (original?.file?.name || `section-${Date.now()}`).replace(/\.[^/.]+$/, '');
    const name = `${baseName}-cropped.jpg`;
    const newFile = new File([blob], name, { type: blob.type || 'image/jpeg' });

    // Revoke previous object URL if it was a blob URL
    if (original?.isNew && original?.url && original.url.startsWith('blob:')) URL.revokeObjectURL(original.url);

    const updated = [...sectionList];
    updated[sectionIndex].gambar[imageIndex] = { url: URL.createObjectURL(newFile), file: newFile, isNew: true, caption: updated[sectionIndex].gambar[imageIndex]?.caption || '' };
    setSectionList(updated);
    onChange(updated);
    setSectionCropDialog({ isOpen: false, sectionIndex: null, imageIndex: null, src: null });
  };

  const handleRemoveImage = (sectionIndex, imageIndex) => {
    const updated = [...sectionList];
    const img = updated[sectionIndex].gambar[imageIndex];
    if (img?.isNew && img?.url) URL.revokeObjectURL(img.url);
    updated[sectionIndex].gambar = updated[sectionIndex].gambar.filter((_, i) => i !== imageIndex);
    setSectionList(updated);
    onChange(updated);
  };

  const handleUpdateImageCaption = (sectionIndex, imageIndex, value) => {
    const updated = [...sectionList];
    if (!updated[sectionIndex].gambar[imageIndex]) updated[sectionIndex].gambar[imageIndex] = { url: '', caption: '' };
    updated[sectionIndex].gambar[imageIndex].caption = value;
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

      {sectionList.map((section, index) => {
        const imageUrl = section.gambar ? (typeof section.gambar === 'string' ? section.gambar : section.gambar.url) : null;
        const imageCaption = section.gambar && typeof section.gambar === 'object' ? section.gambar.caption : '';

        return (
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
                <label>Gambar (Upload)</label>

                <label className={styles.uploadLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadImages(index, e.target.files)}
                  />
                  <div className={styles.uploadButton}>
                    <div className={styles.uploadIcon}>+</div>
                    <span>Upload Gambar</span>
                  </div>
                </label>

                <small>Kosongkan jika tidak ingin menampilkan gambar</small>

                {/* Multiple image previews for this section */}
                {section.gambar && section.gambar.length > 0 && (
                  <div className={styles.imageRow}>
                    {section.gambar.map((g, imgIdx) => (
                      <div key={imgIdx} className={styles.imagePreviewSmall}>
                        <Image src={g.url} alt={`Section ${index + 1} - ${imgIdx + 1}`} width={140} height={120} style={{ width: '100%', height: 'auto' }} />
                        <div className={styles.imageControls}>
                          <button type="button" onClick={() => handleOpenSectionCrop(index, imgIdx)} className={styles.moveButton}>Crop</button>
                          <button type="button" onClick={() => handleRemoveImage(index, imgIdx)} className={styles.removeButton}>Hapus</button>
                        </div>
                        <input type="text" value={g.caption || ''} onChange={(e) => handleUpdateImageCaption(index, imgIdx, e.target.value)} placeholder="Caption gambar" />
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })}

      <ImageCropDialog
        isOpen={sectionCropDialog.isOpen}
        onClose={() => setSectionCropDialog({ isOpen: false, sectionIndex: null, imageIndex: null, src: null })}
        imageSrc={sectionCropDialog.src}
        onCropDone={handleSectionCropDone}
        fixedAspect={1}
      />
    </div>
  );
}
