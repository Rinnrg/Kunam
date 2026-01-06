import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import MultipleImageUpload from '@src/components/admin/MultipleImageUpload';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from '../produk/form.module.scss';

export default function CreateHomeSection() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    judul: '',
    urutan: 0,
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (imageData) => {
    setImages(imageData.allImages || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.judul) {
        setError('Judul harus diisi');
        setIsSubmitting(false);
        return;
      }

      if (images.length === 0) {
        setError('Minimal satu gambar harus diupload');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/home-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judul: formData.judul,
          gambar: images,
          urutan: parseInt(formData.urutan, 10) || 0,
        }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal membuat section');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Breadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Home Sections', href: null },
            { label: 'Tambah Section', href: null },
          ]}
        />
        <h1 className={styles.title}>Tambah Home Section</h1>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="judul" className={styles.label}>
              Judul Section *
            </label>
            <input
              type="text"
              id="judul"
              name="judul"
              value={formData.judul}
              onChange={handleChange}
              className={styles.input}
              placeholder="Masukkan judul section"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="urutan" className={styles.label}>
              Urutan Tampilan
            </label>
            <input
              type="number"
              id="urutan"
              name="urutan"
              value={formData.urutan}
              onChange={handleChange}
              className={styles.input}
              placeholder="0"
              min="0"
            />
            <small className={styles.hint}>Urutan tampilan section (0 = paling atas)</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Gambar Section *</label>
            <MultipleImageUpload
              onChange={handleImagesChange}
              maxImages={10}
              label="Upload Gambar Section (Max 10)"
            />
            <small className={styles.hint}>Upload satu atau lebih gambar untuk section ini</small>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Section'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
