import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Check if running in production (Vercel)
const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Setup for local development
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (!isProduction && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure formidable
  const formOptions = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
    ...(!isProduction && {
      uploadDir,
      filename: (name, ext) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return `${uniqueSuffix}${ext}`;
      },
    }),
  };

  const form = formidable(formOptions);

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Error uploading file', error: err.message });
        resolve();
        return;
      }

      const fileData = files.file;

      if (!fileData) {
        // eslint-disable-next-line no-console
        console.error('No file in request. Files object:', files);
        res.status(400).json({ message: 'No file uploaded' });
        resolve();
        return;
      }

      const uploadedFile = Array.isArray(fileData) ? fileData[0] : fileData;

      try {
        if (isProduction) {
          // Upload to Vercel Blob in production
          const fileBuffer = fs.readFileSync(uploadedFile.filepath);
          const originalFilename = uploadedFile.originalFilename || uploadedFile.newFilename;
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileExt = path.extname(originalFilename);
          const filename = `products/${timestamp}-${randomString}${fileExt}`;

          const blob = await put(filename, fileBuffer, {
            access: 'public',
            contentType: uploadedFile.mimetype || 'image/jpeg',
          });

          // eslint-disable-next-line no-console
          console.log('File uploaded to Vercel Blob:', blob.url);

          res.status(200).json({ url: blob.url });
        } else {
          // Local filesystem upload (development)
          const filename = path.basename(uploadedFile.filepath);
          const url = `/uploads/${filename}`;

          // eslint-disable-next-line no-console
          console.log('File uploaded locally:', url);

          res.status(200).json({ url });
        }
        resolve();
      } catch (uploadError) {
        // eslint-disable-next-line no-console
        console.error('Upload error:', uploadError);
        res.status(500).json({
          message: 'Error uploading file',
          error: uploadError.message,
        });
        resolve();
      }
    });
  });
}
