/**
 * Upload API untuk Vercel menggunakan Cloudinary
 * 
 * Catatan: Vercel serverless functions tidak bisa menyimpan file ke filesystem
 * karena environment-nya ephemeral (temporary). Setiap request berjalan di
 * container baru yang akan dihapus setelah response.
 * 
 * Solusi: Gunakan external storage service
 */

// Temporary solution using base64 encoding
// For production, you should use:
// 1. Cloudinary (recommended - free 25GB)
// 2. Vercel Blob Storage
// 3. AWS S3
// 4. ImgBB API

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image, filename } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Check if CLOUDINARY_URL is configured
    if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({
        message: 'Cloud storage not configured. Please set up Cloudinary or another storage service.',
        docs: 'https://cloudinary.com/documentation/node_integration',
      });
    }

    // For now, return error with instructions
    return res.status(501).json({
      message: 'Please configure cloud storage',
      instructions: {
        step1: 'Sign up for free Cloudinary account at https://cloudinary.com',
        step2: 'Get your Cloud Name, API Key, and API Secret',
        step3: 'Add to Vercel environment variables:',
        env: {
          CLOUDINARY_CLOUD_NAME: 'your_cloud_name',
          CLOUDINARY_API_KEY: 'your_api_key',
          CLOUDINARY_API_SECRET: 'your_api_secret',
        },
        step4: 'Install cloudinary package: npm install cloudinary',
        step5: 'Redeploy your application',
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error processing upload',
      error: error.message,
    });
  }
}
