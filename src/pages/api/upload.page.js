import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Check if running in production (Vercel)
const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Check if Cloudinary is configured
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary if available
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // In production without Cloudinary, return error
  if (isProduction && !hasCloudinary) {
    return res.status(501).json({
      message: 'Upload not configured',
      error: 'Cloudinary environment variables not set',
      setup: {
        step1: 'Sign up for free at https://cloudinary.com',
        step2: 'Get your credentials from Dashboard',
        step3: 'Add to Vercel Environment Variables:',
        required: {
          CLOUDINARY_CLOUD_NAME: 'your_cloud_name',
          CLOUDINARY_API_KEY: 'your_api_key',
          CLOUDINARY_API_SECRET: 'your_api_secret',
        },
        step4: 'Redeploy your application',
      },
    });
  }

  // Setup for local development
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (!isProduction && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure formidable based on environment
  const formOptions = isProduction
    ? {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        keepExtensions: true,
      }
    : {
        uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filename: (name, ext) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          return `${uniqueSuffix}${ext}`;
        },
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
        if (isProduction && hasCloudinary) {
          // Upload to Cloudinary in production
          const uploadResult = await cloudinary.uploader.upload(uploadedFile.filepath, {
            folder: 'kunam-products',
            resource_type: 'auto',
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
          });

          // eslint-disable-next-line no-console
          console.log('File uploaded to Cloudinary:', uploadResult.secure_url);

          res.status(200).json({ url: uploadResult.secure_url });
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
