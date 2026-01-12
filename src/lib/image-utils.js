// Lightweight image utilities for client-side use
// - compressImageFile: compresses an image File to be below a target size using canvas
// - formatBytes: formats byte counts for display
// - uploadFile: uploads a File via the existing /api/upload endpoint and returns the uploaded URL

export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export async function compressImageFile(file, maxBytes = MAX_IMAGE_SIZE_BYTES) {
  if (!(file && file.type && file.type.startsWith('image/'))) return file;
  if (file.type === 'image/svg+xml') return file; // don't try to compress SVG
  if (file.size <= maxBytes) return file;

  const readAsDataURL = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const dataUrl = await readAsDataURL(file);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const { width, height } = img;

  const scaleEstimate = Math.sqrt(maxBytes / file.size) * 0.95;
  let canvasWidth = Math.max(1, Math.round(width * Math.min(1, scaleEstimate)));
  let canvasHeight = Math.max(1, Math.round(height * Math.min(1, scaleEstimate)));

  const canvasToBlob = (canvas, mime, quality) => new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });

  const targetMime = 'image/jpeg';

  let quality = 0.92;
  const minQuality = 0.5;
  const qualityStep = 0.07;
  let lastBlob = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, targetMime, quality);

    if (!blob) break;

    lastBlob = blob;

    if (blob.size <= maxBytes) {
      const newName = `${file.name.replace(/\.[^/.]+$/, '')}.jpg`;
      return new File([blob], newName, { type: blob.type });
    }

    if (quality - qualityStep >= minQuality) {
      quality -= qualityStep;
    } else if (canvasWidth > 400 && canvasHeight > 400) {
      canvasWidth = Math.max(300, Math.round(canvasWidth * 0.9));
      canvasHeight = Math.max(300, Math.round(canvasHeight * 0.9));
      quality = 0.92;
    } else {
      break;
    }
  }

  if (lastBlob && lastBlob.size < file.size) {
    const newName = `${file.name.replace(/\.[^/.]+$/, '')}.jpg`;
    return new File([lastBlob], newName, { type: lastBlob.type });
  }

  return file;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`;
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || 'Upload failed');
  }
  const data = await response.json();
  return data.url;
}
