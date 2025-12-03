import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Cloudinary setup (only if configured)
let cloudinary;
try {
  // eslint-disable-next-line global-require
  const cloudinaryModule = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary = cloudinaryModule;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch (e) {
  // Cloudinary not installed, will use local upload
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const useCloudinary = cloudinary && process.env.CLOUDINARY_CLOUD_NAME;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  // In production without Cloudinary, return helpful error
  if (isProduction && !useCloudinary) {
    return res.status(501).json({
      message: 'Cloud storage not configured - Cloudinary required for production',
      error: 'CLOUDINARY environment variables not set',
      setup: {
        step1: 'Sign up FREE at https://cloudinary.com/users/register/free (no credit card)',
        step2: 'Login and go to Dashboard',
        step3: 'Copy: Cloud Name, API Key, API Secret',
        step4: 'Add to Vercel: Settings → Environment Variables',
        required: {
          CLOUDINARY_CLOUD_NAME: 'your_cloud_name',
          CLOUDINARY_API_KEY: 'your_api_key',
          CLOUDINARY_API_SECRET: 'your_api_secret',
        },
        step5: 'Redeploy (automatic after saving env vars)',
        docs: 'See VERCEL_UPLOAD_FIX.md for detailed guide',
      },
    });
  }

  // For local development, use local filesystem
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (!useCloudinary && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const formOptions = useCloudinary
    ? {
        maxFileSize: 10 * 1024 * 1024, // 10MB for Cloudinary
        keepExtensions: true,
      }
    : {
        uploadDir,
        keepExtensions: true,
        maxFileSize: 4.5 * 1024 * 1024, // 4.5MB for local/Vercel
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
        if (useCloudinary) {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
            folder: 'kunam-products',
            resource_type: 'auto',
          });

          // eslint-disable-next-line no-console
          console.log('File uploaded to Cloudinary:', result.secure_url);
          res.status(200).json({ url: result.secure_url });
        } else {
          // Local upload
          const filename = path.basename(uploadedFile.filepath);
          const url = `/uploads/${filename}`;

          // eslint-disable-next-line no-console
          console.log('File uploaded locally:', url);
          res.status(200).json({ url });
        }
        resolve();
      } catch (uploadError) {
        // eslint-disable-next-line no-console
        console.error('Upload to cloud error:', uploadError);
        res.status(500).json({ message: 'Error uploading to storage', error: uploadError.message });
        resolve();
      }
    });
  });
}
