import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import Image from 'next/image';
import styles from './MultipleImageUpload.module.scss';
import { compressImageFile, formatBytes, MAX_IMAGE_SIZE_BYTES } from '@src/lib/image-utils';
import ImageCropDialog from '@src/components/admin/ImageCropDialog';

function MultipleImageUpload({ existingImages = [], images: propImages, onChange, allowCaption = false }) {
  // Initialize from either existingImages (legacy string array) or propImages (new object array)
  const initialImages = (propImages && propImages.length > 0)
    ? propImages.map((img, index) => ({
        url: typeof img === 'string' ? img : (img.url || img),
        isNew: !!img.file,
        isThumbnail: img.isThumbnail || (index === 0 && !img.isThumbnail),
        file: img.file || null,
        caption: img.caption || '',
      }))
    : existingImages.map((url, index) => ({
        url: typeof url === 'string' ? url : url.url,
        isNew: false,
        isThumbnail: index === 0,
        file: null,
        caption: '',
      }));
      
  const [images, setImages] = useState(initialImages);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [cropDialog, setCropDialog] = useState({ isOpen: false, index: null, src: null, fixedAspect: null });
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  const openCrop = useCallback((index, fixedAspect = null) => {
    if (!images[index]) return;
    setCropDialog({ isOpen: true, index, src: images[index].url, fixedAspect });
  }, [images]);

  const closeCrop = useCallback(() => setCropDialog({ isOpen: false, index: null, src: null, fixedAspect: null }), []);

  const handleCropDone = useCallback(async (blob) => {
    const { index } = cropDialog;
    if (index === null || index === undefined) return;

    const original = images[index];
    const baseName = (original?.file?.name || `image-${Date.now()}`).replace(/\.[^/.]+$/, '');
    const name = `${baseName}-cropped.jpg`;
    const newFile = new File([blob], name, { type: blob.type || 'image/jpeg' });

    // Revoke previous object URL if it was a blob URL
    if (original?.isNew && original?.url && original.url.startsWith('blob:')) {
      URL.revokeObjectURL(original.url);
    }

    const updatedImages = [...images];
    updatedImages[index] = {
      ...original,
      file: newFile,
      url: URL.createObjectURL(newFile),
      isNew: true,
    };

    setImages(updatedImages);

    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages.map(img => ({ url: img.url, file: img.file, isNew: img.isNew, isThumbnail: img.isThumbnail, caption: img.caption || '' })),
      });
    }

    closeCrop();
  }, [cropDialog, images, onChange, closeCrop]);

  // Handle new file selection (compress if larger than 1MB)
  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let compressedCount = 0;
    let originalTotal = 0;
    let compressedTotal = 0;

    const processedFiles = await Promise.all(files.map(async (file) => {
      originalTotal += file.size;

      try {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          const compressed = await compressImageFile(file, MAX_IMAGE_SIZE_BYTES);
          if (compressed.size < file.size) {
            compressedCount += 1;
            compressedTotal += compressed.size;
            return compressed;
          }
          // compression didn't help
          compressedTotal += file.size;
          return file;
        }
        compressedTotal += file.size;
        return file;
      } catch (err) {
        // Failed to compress - use original file
        // eslint-disable-next-line no-console
        console.error('Compression error:', err);
        compressedTotal += file.size;
        return file;
      }
    }));

    // Create image objects with object URLs
    const newImages = processedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      isNew: true,
      isThumbnail: images.length === 0 && idx === 0, // only the first new file becomes thumbnail if there were no existing images
      file,
      caption: '',
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // If any compression happened, show a single summary alert
    if (compressedCount > 0) {
      showAlert({
        title: 'Gambar terkompres',
        message: `Berhasil mengkompres ${compressedCount} gambar. Ukuran total: ${formatBytes(originalTotal)} → ${formatBytes(compressedTotal)}.`,
        type: 'info',
      });
    }

    // Call onChange with ALL image objects (including isThumbnail flag)
    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages.map(img => ({
          url: img.url,
          file: img.file,
          isNew: img.isNew,
          isThumbnail: img.isThumbnail,
          caption: img.caption || '',
        })),
      });
    }
  }, [images, onChange, showAlert]);

  // Update caption for an image
  const updateCaption = useCallback((index, caption) => {
    const updatedImages = [...images];
    updatedImages[index] = { ...updatedImages[index], caption };
    setImages(updatedImages);

    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages.map(img => ({ url: img.url, file: img.file, isNew: img.isNew, isThumbnail: img.isThumbnail, caption: img.caption || '' })),
      });
    }
  }, [images, onChange]);

  // Set thumbnail
  const setThumbnail = useCallback((index) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isThumbnail: i === index,
    }));
    setImages(updatedImages);

    if (onChange) {
      const thumbnail = updatedImages[index];
      const gallery = updatedImages.filter((_, i) => i !== index);
      onChange({
        thumbnail: thumbnail.file || thumbnail.url,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages.map(img => ({
          url: img.url,
          file: img.file,
          isNew: img.isNew,
          isThumbnail: img.isThumbnail,
        })),
      });
    }
  }, [images, onChange]);

  // Remove image
  const removeImage = useCallback((index) => {
    const imageToRemove = images[index];

    // Confirm before removing
    showAlert({
      type: 'confirm',
      title: 'Hapus Gambar',
      message: 'Apakah Anda yakin ingin menghapus gambar ini? Perubahan ini belum disimpan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: () => {
        // Revoke object URL if it's a new image
        if (imageToRemove?.isNew && imageToRemove.url) {
          URL.revokeObjectURL(imageToRemove.url);
        }

        const updatedImages = images.filter((_, i) => i !== index);

        // If removed image was thumbnail, set first image as new thumbnail
        if (imageToRemove?.isThumbnail && updatedImages.length > 0) {
          updatedImages[0].isThumbnail = true;
        }

        setImages(updatedImages);

        if (onChange) {
          const thumbnail = updatedImages.find(img => img.isThumbnail);
          const gallery = updatedImages.filter(img => !img.isThumbnail);
          onChange({
            thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
            gallery: gallery.map(img => img.file || img.url),
            allImages: updatedImages.map(img => ({
              url: img.url,
              file: img.file,
              isNew: img.isNew,
              isThumbnail: img.isThumbnail,
            })),
          });
        }
      }
    });
  }, [images, onChange, showAlert]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedImages = [...images];
    const [draggedItem] = updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(index, 0, draggedItem);

    setImages(updatedImages);
    setDraggedIndex(index);

    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages.map(img => ({
          url: img.url,
          file: img.file,
          isNew: img.isNew,
          isThumbnail: img.isThumbnail,
        })),
      });
    }
  }, [draggedIndex, images, onChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Product Images</h3>
        <p className={styles.hint}>
          Click ⭐ to set as thumbnail (main image). Drag to reorder.
        </p>
      </div>

      {/* Image Grid */}
      <div className={styles.imageGrid}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`${styles.imageCard} ${image.isThumbnail ? styles.thumbnail : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Image Preview */}
            <div className={styles.imagePreview}>
              <Image
                src={image.url}
                alt={`Product ${index + 1}`}
                fill
                sizes="200px"
                style={{ objectFit: 'cover' }}
              />
            </div>

            {/* Badge */}
            {image.isThumbnail && (
              <div className={styles.thumbnailBadge}>
                <span>📌 Thumbnail</span>
              </div>
            )}

            {/* Actions */}
            <div className={styles.imageActions}>
              <button
                type="button"
                className={styles.setThumbnailBtn}
                onClick={() => setThumbnail(index)}
                title="Set as thumbnail"
                disabled={image.isThumbnail}
              >
                ⭐
              </button>
              <button
                type="button"
                className={styles.cropBtn}
                onClick={() => openCrop(index, 3 / 4)}
                title="Crop image (3:4)"
              >
                ✂️
              </button>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(index)}
                title="Remove image"
              >
                🗑️
              </button>
            </div>

            {/* Image Info */}
            <div className={styles.imageInfo}>
              <span className={styles.imageNumber}>#{index + 1}</span>
              {image.isNew && <span className={styles.newBadge}>New</span>}
            </div>

            {/* Caption input (optional) */}
            {allowCaption && (
              <div className={styles.captionWrapper}>
                <input
                  type="text"
                  value={image.caption || ''}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  placeholder="Caption gambar"
                />
              </div>
            )}
          </div>
        ))}

        {/* Upload Button */}
        <label className={styles.uploadButton}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className={styles.uploadIcon}>+</div>
          <span>Add Images</span>
        </label>

        {/* Crop Dialog */}
        <ImageCropDialog
          isOpen={cropDialog.isOpen}
          onClose={closeCrop}
          imageSrc={cropDialog.src}
          onCropDone={handleCropDone}
          fixedAspect={cropDialog.fixedAspect}
        />
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <p>
          Total: <strong>{images.length}</strong> image{images.length !== 1 ? 's' : ''}
          {' | '}
          Thumbnail: <strong>{images.findIndex(img => img.isThumbnail) + 1 || 'None'}</strong>
          {' | '}
          Gallery: <strong>{images.filter(img => !img.isThumbnail).length}</strong>
        </p>
      </div>
    </div>
  );
}

export default MultipleImageUpload;
