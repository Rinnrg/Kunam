import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './MultipleImageUpload.module.scss';

/**
 * Multiple Image Upload Component
 * Supports:
 * - Thumbnail selection (main image)
 * - Multiple gallery images
 * - Drag and drop reordering
 * - Preview existing and new images
 */
function MultipleImageUpload({ existingImages = [], onChange }) {
  const [images, setImages] = useState(existingImages.map((url, index) => ({
    url,
    isNew: false,
    isThumbnail: index === 0, // First image is thumbnail by default
    file: null,
  })));
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Handle new file selection
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      isNew: true,
      isThumbnail: images.length === 0, // First image if no images exist
      file,
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    
    // Call onChange with separated thumbnail and gallery
    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages,
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
        allImages: updatedImages,
      });
    }
  }, [images, onChange]);

  // Remove image
  const removeImage = useCallback((index) => {
    const imageToRemove = images[index];
    
    // Revoke object URL if it's a new image
    if (imageToRemove.isNew && imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    
    // If removed image was thumbnail, set first image as new thumbnail
    if (imageToRemove.isThumbnail && updatedImages.length > 0) {
      updatedImages[0].isThumbnail = true;
    }

    setImages(updatedImages);

    if (onChange) {
      const thumbnail = updatedImages.find(img => img.isThumbnail);
      const gallery = updatedImages.filter(img => !img.isThumbnail);
      onChange({
        thumbnail: thumbnail ? (thumbnail.file || thumbnail.url) : null,
        gallery: gallery.map(img => img.file || img.url),
        allImages: updatedImages,
      });
    }
  }, [images, onChange]);

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
        allImages: updatedImages,
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
