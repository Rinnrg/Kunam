import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
// eslint-disable-next-line import/extensions
import MultipleImageUpload from '@src/components/admin/MultipleImageUpload';
import ColorSelector from '@src/components/admin/ColorSelector';
import SectionsEditor from '@src/components/admin/SectionsEditor';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from '../form.module.scss';

export default function EditProduk() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    sections: [],
    kategori: '',
    harga: '',
    diskon: '0',
    stok: '0',
    ukuran: [],
    warna: [],
    thumbnail: '',
    images: [],
    videos: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [productImages, setProductImages] = useState({
    thumbnail: null,
    gallery: [],
    allImages: []
  });
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [ukuranInputs, setUkuranInputs] = useState([{ id: Date.now(), size: '', qty: '' }]);

  const fetchProduk = async () => {
    try {
      const response = await fetch(`/api/produk/${id}`);
      if (response.ok) {
        const data = await response.json();

        setFormData({
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          sections: data.sections || [],
          kategori: data.kategori,
          harga: data.harga.toString(),
          diskon: data.diskon ? data.diskon.toString() : '0',
          stok: data.stok.toString(),
          ukuran: data.ukuran || [],
          warna: data.warna || [],
          thumbnail: data.thumbnail || '',
          images: data.gambar || data.images || [],
          videos: data.video || data.videos || [],
        });
        
        const imagesArray = data.gambar || data.images || [];
        const videosArray = data.video || data.videos || [];

        // Convert existing images to proper format with isThumbnail flag
        const imageObjects = imagesArray.map((url, index) => ({
          url,
          file: null,
          isNew: false,
          isThumbnail: url === data.thumbnail || (index === 0 && !data.thumbnail),
        }));

        // Set existing images for MultipleImageUpload component
        setProductImages({
          thumbnail: data.thumbnail || (imagesArray.length > 0 ? imagesArray[0] : null),
          gallery: imagesArray,
          allImages: imageObjects
        });
        
        setExistingVideos(videosArray);

        // Parse existing ukuran data (format: "S:3", "M:4")
        if (data.ukuran && data.ukuran.length > 0) {
          const parsedUkuran = data.ukuran.map((item, idx) => {
            const [size, qty] = item.split(':');
            return { id: Date.now() + idx, size: size || '', qty: qty || '' };
          });
          setUkuranInputs(parsedUkuran);
        }
      } else {
        setError('Produk tidak ditemukan');
      }
    } catch (err) {
      setError('Error loading produk');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (id && session) {
      fetchProduk();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUkuranChange = (index, field, value) => {
    const newUkuran = [...ukuranInputs];
    newUkuran[index][field] = value;
    setUkuranInputs(newUkuran);

    // Update formData with size format: "S:3, M:4, L:5"
    const ukuranArray = newUkuran.filter((item) => item.size && item.qty).map((item) => `${item.size}:${item.qty}`);

    setFormData((prev) => ({
      ...prev,
      ukuran: ukuranArray,
    }));
  };

  const addUkuranInput = () => {
    setUkuranInputs([...ukuranInputs, { id: Date.now() + Math.random(), size: '', qty: '' }]);
  };

  const removeUkuranInput = (index) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Ukuran',
      message: 'Apakah Anda yakin ingin menghapus ukuran ini? Perubahan ini belum disimpan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: () => {
        const newUkuran = ukuranInputs.filter((_, i) => i !== index);
        setUkuranInputs(newUkuran);

        // Update formData
        const ukuranArray = newUkuran.filter((item) => item.size && item.qty).map((item) => `${item.size}:${item.qty}`);

        setFormData((prev) => ({
          ...prev,
          ukuran: ukuranArray,
        }));
      }
    });
  };

  const getTotalUkuran = () => ukuranInputs.reduce((total, item) => total + (parseInt(item.qty, 10) || 0), 0);

  const getRemainingStock = () => {
    const stok = parseInt(formData.stok, 10) || 0;
    const totalUkuran = getTotalUkuran();
    return stok - totalUkuran;
  };

  const handleImagesChange = (imageData) => {
    setProductImages(imageData);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    setVideoFiles(files);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setVideoPreviews(previews);
  };

  const removeNewVideo = (index) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Video',
      message: 'Apakah Anda yakin ingin menghapus video ini dari preview? Perubahan ini belum disimpan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: () => {
        const newFiles = videoFiles.filter((_, i) => i !== index);
        const newPreviews = videoPreviews.filter((_, i) => i !== index);
        setVideoFiles(newFiles);
        setVideoPreviews(newPreviews);

        // Revoke the URL to free memory
        if (videoPreviews[index]?.startsWith('blob:')) {
          URL.revokeObjectURL(videoPreviews[index]);
        }
      }
    });
  };

  const removeExistingVideo = (index) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Video',
      message: 'Apakah Anda yakin ingin menghapus video ini? Perubahan ini belum disimpan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: () => {
        const newExisting = existingVideos.filter((_, i) => i !== index);
        setExistingVideos(newExisting);
      }
    });
  };

  const uploadImages = async () => {
    // Filter only File objects from allImages (new uploads)
    const newImages = productImages.allImages
      .filter(img => img && img.isNew && img.file instanceof File)
      .map(img => img.file);
    
    if (newImages.length === 0) return [];

    setIsUploading(true);

    try {
      const uploadPromises = newImages.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        // eslint-disable-next-line no-console
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload image');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error uploading images:', err);
      throw new Error(`Error uploading images: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVideos = async () => {
    if (videoFiles.length === 0) return [];

    try {
      const uploadPromises = videoFiles.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        }
        throw new Error('Failed to upload video');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (err) {
      throw new Error('Error uploading videos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate total ukuran
    if (getTotalUkuran() > parseInt(formData.stok, 10)) {
      setError('Total ukuran melebihi stok yang tersedia!');
      return;
    }

    if (getTotalUkuran() < parseInt(formData.stok, 10)) {
      setError('Total ukuran harus sama dengan stok!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images and videos if any
      const uploadedImageUrls = await uploadImages();
      const uploadedVideoUrls = await uploadVideos();

      // Get existing image URLs (objects with url property or strings)
      const existingImageUrls = productImages.allImages
        .filter(img => !img.isNew)
        .map(img => (typeof img === 'string' ? img : img.url));
      
      // Combine existing with newly uploaded ones
      const allImages = [...existingImageUrls, ...uploadedImageUrls];
      const allVideos = [...existingVideos, ...uploadedVideoUrls];
      
      // Determine thumbnail URL - find the image marked as thumbnail
      let thumbnailUrl = '';
      if (productImages.allImages && productImages.allImages.length > 0) {
        // Find the thumbnail image
        const thumbnailImage = productImages.allImages.find(img => img.isThumbnail);
        if (thumbnailImage) {
          if (thumbnailImage.isNew) {
            // It's a new upload - find its index among new images
            const newImages = productImages.allImages.filter(img => img.isNew);
            const thumbnailIndexInNew = newImages.findIndex(img => img === thumbnailImage);
            if (thumbnailIndexInNew !== -1 && uploadedImageUrls[thumbnailIndexInNew]) {
              thumbnailUrl = uploadedImageUrls[thumbnailIndexInNew];
            }
          } else {
            // It's an existing image
            thumbnailUrl = typeof thumbnailImage === 'string' ? thumbnailImage : thumbnailImage.url;
          }
        }
      }
      
      // Fallback to first image if no thumbnail marked
      if (!thumbnailUrl && allImages.length > 0) {
        thumbnailUrl = allImages[0];
      }

      // Prepare form data with all media
      const dataToSubmit = {
        ...formData,
        thumbnail: thumbnailUrl,
        images: allImages,
        videos: allVideos,
      };

      const response = await fetch(`/api/produk/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.message || 'Error updating produk');
      }
    } catch (err) {
      setError(err.message || 'Error updating produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className={styles.loader}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Edit Produk', href: null }
      ]} />
      <div className={styles.header}>
        <button type="button" onClick={() => showAlert({ type: 'confirm', title: 'Kembali', message: 'Apakah Anda yakin ingin kembali dan membatalkan perubahan? Semua perubahan belum disimpan akan hilang.', confirmText: 'Ya, Kembali', cancelText: 'Tetap di sini', showCancel: true, onConfirm: () => router.push('/admin') })} className={styles.backButton}>
          Kembali ke Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        {/* Basic Information Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>📝 Informasi Dasar</h3>
          <label htmlFor="nama" className={styles.label}>
            Nama Produk *
            <input id="nama" name="nama" type="text" value={formData.nama} onChange={handleChange} className={styles.input} placeholder="Masukkan nama produk" required />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="kategori" className={styles.label}>
            Kategori *
            <select id="kategori" name="kategori" value={formData.kategori} onChange={handleChange} className={styles.input} required>
              <option value="">Pilih Kategori</option>
              <option value="T-Shirt">T-Shirt</option>
              <option value="Hoodie">Hoodie</option>
              <option value="Jacket">Jacket</option>
              <option value="Pants">Pants</option>
              <option value="Shorts">Shorts</option>
              <option value="Accessories">Accessories</option>
            </select>
          </label>
        </div>

        {/* Pricing Section */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <h3 className={styles.sectionHeader}>💰 Harga & Stok</h3>
            <label htmlFor="harga" className={styles.label}>
              Harga (Rp) *
              <input id="harga" name="harga" type="number" step="1" value={formData.harga} onChange={handleChange} className={styles.input} placeholder="Contoh: 200000" required />
            </label>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="diskon" className={styles.label}>
              Diskon (%)
              <input id="diskon" name="diskon" type="number" step="1" min="0" max="100" value={formData.diskon} onChange={handleChange} className={styles.input} placeholder="Contoh: 20" />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stok" className={styles.label}>
              Stok *
              <input id="stok" name="stok" type="number" value={formData.stok} onChange={handleChange} className={styles.input} placeholder="Jumlah stok" required />
            </label>
          </div>
        </div>

        {/* Description Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>📄 Deskripsi Produk</h3>
          <label className={styles.label}>
            Deskripsi / Product Sections
            <span className={styles.helpText}>
              Sections akan ditampilkan sebagai detail produk di bawah gallery foto
            </span>
          </label>
          <SectionsEditor
            sections={formData.sections}
            onChange={(newSections) => setFormData({ ...formData, sections: newSections })}
          />
        </div>

        {/* Size Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>📏 Ukuran Produk</h3>
          <label htmlFor="ukuran-select-0" className={styles.label}>
            Ukuran & Jumlah per Ukuran *
            <span className={styles.stockInfo}>
              Total: {getTotalUkuran()} / {formData.stok || 0} | Sisa: {getRemainingStock()}
            </span>
          </label>

          {ukuranInputs.map((ukuran, index) => (
            <div key={ukuran.id} className={styles.ukuranRow}>
              <select id={`ukuran-select-${index}`} value={ukuran.size} onChange={(e) => handleUkuranChange(index, 'size', e.target.value)} className={styles.ukuranSelect}>
                <option value="">Pilih Ukuran</option>
                <option value="XXS">XXS</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="XXXL">XXXL</option>
              </select>

              <input
                type="number"
                min="1"
                max={getRemainingStock() + (parseInt(ukuran.qty, 10) || 0)}
                value={ukuran.qty}
                onChange={(e) => handleUkuranChange(index, 'qty', e.target.value)}
                className={styles.ukuranQty}
                placeholder="Jumlah"
              />

              {ukuranInputs.length > 1 && (
                <button type="button" onClick={() => removeUkuranInput(index)} className={styles.removeUkuranButton}>
                  ×
                </button>
              )}
            </div>
          ))}

          {getTotalUkuran() < parseInt(formData.stok, 10) && (
            <button type="button" onClick={addUkuranInput} className={styles.addUkuranButton}>
              Tambah Ukuran
            </button>
          )}

          {getTotalUkuran() > parseInt(formData.stok, 10) && <p className={styles.errorText}>Total ukuran melebihi stok yang tersedia!</p>}
        </div>

        {/* Color Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>🎨 Warna Produk</h3>
          <label className={styles.label}>
            Pilih Warna yang Tersedia
          </label>
          <ColorSelector
            selectedColors={formData.warna}
            onChange={(colors) => setFormData({ ...formData, warna: colors })}
          />
        </div>

        {/* Images Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>📸 Foto Produk</h3>
          <label className={styles.label}>
            Upload Foto Produk
            <span className={styles.helpText}>
              Foto pertama akan menjadi thumbnail, semua foto akan ditampilkan di gallery produk
            </span>
          </label>
          <MultipleImageUpload
            images={productImages.allImages}
            thumbnail={productImages.thumbnail}
            onChange={handleImagesChange}
          />
        </div>

        {/* Video Section */}
        <div className={styles.formGroup}>
          <h3 className={styles.sectionHeader}>🎥 Video Produk</h3>

          {/* Existing Videos */}
          {existingVideos.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Video Saat Ini:</p>
              <div className={styles.videoPreviewContainer}>
                {existingVideos.map((video, index) => (
                  <div key={video} className={styles.videoPreview}>
                    <video src={video} controls className={styles.videoElement}>
                      <track kind="captions" />
                    </video>
                    <button type="button" onClick={() => removeExistingVideo(index)} className={styles.removeVideoButton}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add New Videos */}
          <label htmlFor="videos" className={styles.label} style={{ marginTop: '16px' }}>
            Tambah Video Baru (opsional)
            <input id="videos" name="videos" type="file" accept="video/*" multiple onChange={handleVideoChange} className={styles.fileInput} />
          </label>

          {/* New Video Previews */}
          {videoPreviews.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Preview Video Baru:</p>
              <div className={styles.videoPreviewContainer}>
                {videoPreviews.map((preview, index) => (
                  <div key={preview} className={styles.videoPreview}>
                    <video src={preview} controls className={styles.videoElement}>
                      <track kind="captions" />
                    </video>
                    <button type="button" onClick={() => removeNewVideo(index)} className={styles.removeVideoButton}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => showAlert({ type: 'confirm', title: 'Batal', message: 'Apakah Anda yakin ingin membatalkan? Semua perubahan belum disimpan akan hilang.', confirmText: 'Ya, Batal', cancelText: 'Kembali', showCancel: true, onConfirm: () => router.push('/admin') })} className={styles.cancelButton} disabled={isSubmitting}>
            ❌ Batal
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting || isUploading}>
            {(() => {
              if (isUploading) return '⏳ Mengupload...';
              if (isSubmitting) return '⏳ Menyimpan...';
              return '✅ Simpan Perubahan';
            })()}
          </button>
        </div>
      </form>
    </div>
  );
}
