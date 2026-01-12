import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import styles from './ImageCropDialog.module.scss';

// Helper to create an HTMLImageElement from a URL
const createImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.setAttribute('crossOrigin', 'anonymous');
  img.onload = () => resolve(img);
  img.onerror = (err) => reject(err);
  img.src = url;
});

// Produce a Blob from the cropped area
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.92);
  });
}

export default function ImageCropDialog({ isOpen, onClose, imageSrc, onCropDone, fixedAspect = null }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(fixedAspect !== null ? fixedAspect : 1);

  React.useEffect(() => {
    if (fixedAspect !== null && fixedAspect !== undefined) setAspect(fixedAspect);
  }, [fixedAspect]);

  const onCropComplete = useCallback((_, croppedAreaPixelsArg) => {
    setCroppedAreaPixels(croppedAreaPixelsArg);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (blob) onCropDone(blob);
    onClose();
  }, [croppedAreaPixels, imageSrc, onCropDone, onClose]);

  if (!isOpen) return null;

  const dialog = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className={styles.header}>
          <h3>Crop Gambar</h3>
          <div className={styles.controls}>
            {fixedAspect === null && (
              <label>
                Aspect:
                <select value={aspect} onChange={(e) => setAspect(Number(e.target.value))}>
                  <option value={1}>1:1</option>
                  <option value={4 / 3}>4:3</option>
                  <option value={16 / 9}>16:9</option>
                  <option value={0}>Free</option>
                </select>
              </label>
            )}
          </div>
        </div>

        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect === 0 ? undefined : aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className={styles.sliderRow}>
          <label>Zoom</label>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>Batal</button>
          <button type="button" className={styles.saveButton} onClick={handleSave}>Crop</button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
