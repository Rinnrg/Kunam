import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import MultipleImageUpload from '@src/components/admin/MultipleImageUpload';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from '../../produk/form.module.scss';

export default function EditHomeSection() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    judul: '',
    urutan: 0,
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSection = async () => {
    try {
      const response = await fetch(`/api/home-sections/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          judul: data.judul,
          urutan: data.urutan,
        });
        setExistingImages(data.gambar || []);
      } else {
        setError('Section tidak ditemukan');
      }
    } catch (err) {
      setError('Gagal memuat data section');
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
    if (id && status === 'authenticated') {
      fetchSection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);
      setIsLoading(false);
    }
  };

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

      const finalImages = images.length > 0 ? images : existingImages;

      if (finalImages.length === 0) {
        setError('Minimal satu gambar harus diupload');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/home-sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judul: formData.judul,
          gambar: finalImages,
          urutan: parseInt(formData.urutan, 10) || 0,
        }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal mengupdate section');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengupdate section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
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
            { label: 'Edit Section', href: null },
          ]}
        />
        <h1 className={styles.title}>Edit Home Section</h1>
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
            {existingImages.length > 0 && (
              <div className={styles.existingImages}>
                <p>Gambar yang sudah ada:</p>
                <div className={styles.imageGrid}>
                  {existingImages.map((img, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={index} src={img} alt={`Existing ${index}`} className={styles.thumbnail} />
                  ))}
                </div>
              </div>
            )}
            <MultipleImageUpload
              onChange={handleImagesChange}
              maxImages={10}
              label="Upload Gambar Baru (Max 10)"
            />
            <small className={styles.hint}>
              Upload gambar baru untuk mengganti yang lama, atau biarkan kosong untuk tetap menggunakan gambar yang ada
            </small>
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
              {isSubmitting ? 'Menyimpan...' : 'Update Section'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
