import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import styles from '../admin.module.scss';

export default function HomeSectionManager() {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    images: [],
    layoutType: 'slider',
    columns: 3,
    autoplay: true,
    interval: 3000,
    order: 0,
    isActive: true,
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/home-sections');
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      showAlert({ type: 'error', title: 'Gagal', message: 'Gagal mengambil data sections' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      images: [],
      layoutType: 'slider',
      columns: 3,
      autoplay: true,
      interval: 3000,
      order: 0,
      isActive: true,
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    // Revoke blob URL
    if (previewUrls[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('layoutType', formData.layoutType);
      formDataToSend.append('columns', formData.columns);
      formDataToSend.append('autoplay', formData.autoplay);
      formDataToSend.append('interval', formData.interval);
      formDataToSend.append('order', formData.order);
      formDataToSend.append('isActive', formData.isActive);

      // Add new files
      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // Add existing image URLs
      const existingImages = previewUrls.filter(
        (url) => !url.startsWith('blob:')
      );
      formDataToSend.append('existingImages', JSON.stringify(existingImages));

      const url = editingId
        ? `/api/admin/home-sections?id=${editingId}`
        : '/api/admin/home-sections';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        showAlert({ type: 'success', title: 'Berhasil', message: editingId ? 'Section berhasil diupdate!' : 'Section berhasil ditambahkan!' });
        resetForm();
        fetchSections();
      } else {
        showAlert({ type: 'error', title: 'Gagal', message: result.error || 'Gagal menyimpan section' });
      }
    } catch (error) {
      console.error('Error saving section:', error);
      showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Terjadi kesalahan saat menyimpan section' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    setEditingId(section.id);
    setFormData({
      title: section.title,
      images: section.images,
      layoutType: section.layoutType || 'slider',
      columns: section.columns || 3,
      autoplay: section.autoplay !== false,
      interval: section.interval || 3000,
      order: section.order,
      isActive: section.isActive,
    });
    setPreviewUrls(section.images);
  };

  const handleDelete = async (id) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Section',
      message: 'Yakin ingin menghapus section ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/home-sections?id=${id}`, { method: 'DELETE' });
          if (response.ok) {
            showAlert({ type: 'success', title: 'Berhasil', message: 'Section berhasil dihapus!' });
            fetchSections();
          } else {
            showAlert({ type: 'error', title: 'Gagal', message: 'Gagal menghapus section' });
          }
        } catch (error) {
          console.error('Error deleting section:', error);
          showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Terjadi kesalahan saat menghapus section' });
        }
      }
    })
   };

  return (
    <div className={styles.section}>
      <h2>Home Sections Manager</h2>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3>{editingId ? 'Edit Section' : 'Tambah Section Baru'}</h3>

          <div className={styles.formGroup}>
            <label>Judul Section</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={styles.input}
              placeholder="Judul Section"
              required
            />

            <label>Tipe Layout</label>
            <select
              value={formData.layoutType}
              onChange={(e) =>
                setFormData({ ...formData, layoutType: e.target.value })
              }
              className={styles.input}
            >
              <option value="slider">Slider (Slideshow)</option>
              <option value="grid">Grid (Kotak-kotak)</option>
              <option value="masonry">Masonry (Pinterest style)</option>
              <option value="carousel">Carousel (Scroll horizontal)</option>
            </select>

            {formData.layoutType === 'grid' && (
              <>
                <label>Jumlah Kolom</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.columns}
                  onChange={(e) =>
                    setFormData({ ...formData, columns: parseInt(e.target.value, 10) })
                  }
                  className={styles.input}
                />
              </>
            )}

            {(formData.layoutType === 'slider' || formData.layoutType === 'carousel') && (
              <>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.autoplay}
                    onChange={(e) =>
                      setFormData({ ...formData, autoplay: e.target.checked })
                    }
                  />
                  <span>Autoplay</span>
                </label>

                {formData.autoplay && (
                  <>
                    <label>Interval (ms)</label>
                    <input
                      type="number"
                      min="1000"
                      max="10000"
                      step="500"
                      value={formData.interval}
                      onChange={(e) =>
                        setFormData({ ...formData, interval: parseInt(e.target.value, 10) })
                      }
                      className={styles.input}
                    />
                  </>
                )}
              </>
            )}

            <label>Upload Gambar (Multiple)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className={styles.input}
            />

            {previewUrls.length > 0 && (
              <div className={styles.previewGrid}>
                {previewUrls.map((url, index) => (
                  <div key={index} className={styles.previewItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label>Order (Urutan)</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value, 10) })
              }
              className={styles.input}
            />

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <span>Aktif</span>
            </label>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading && 'Menyimpan...'}
              {!loading && editingId && 'Update'}
              {!loading && !editingId && 'Tambah'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className={styles.cancelBtn}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.listContainer}>
        <h3>Daftar Sections</h3>
        {sections.length === 0 ? (
          <p>Belum ada section</p>
        ) : (
          <div className={styles.sectionList}>
            {sections.map((section) => (
              <div key={section.id} className={styles.sectionCard}>
                <div className={styles.sectionImages}>
                  {section.images?.slice(0, 3).map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={img} alt={`${section.title} ${idx + 1}`} />
                  ))}
                  {section.images?.length > 3 && (
                    <div className={styles.moreImages}>
                      +{section.images.length - 3} lainnya
                    </div>
                  )}
                </div>
                <div className={styles.sectionInfo}>
                  <p>
                    <strong>Judul:</strong> {section.title}
                  </p>
                  <p>
                    <strong>Tipe:</strong> {section.layoutType || 'slider'}
                  </p>
                  {section.layoutType === 'grid' && (
                    <p>
                      <strong>Kolom:</strong> {section.columns}
                    </p>
                  )}
                  {(section.layoutType === 'slider' || section.layoutType === 'carousel') && (
                    <p>
                      <strong>Autoplay:</strong> {section.autoplay ? 'Ya' : 'Tidak'}
                      {section.autoplay && ` (${section.interval}ms)`}
                    </p>
                  )}
                  <p>
                    <strong>Gambar:</strong> {section.images?.length || 0} gambar
                  </p>
                  <p>
                    <strong>Order:</strong> {section.order}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {section.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                  </p>
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      onClick={() => handleEdit(section)}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(section.id)}
                      className={styles.deleteBtn}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
