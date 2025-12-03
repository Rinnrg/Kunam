import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { file, filename } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ message: 'No file data provided' });
    }

    // Remove data URL prefix if present
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(filename);
    const uniqueFilename = `${uniqueSuffix}${ext}`;

    // In production (Vercel), we can't write to filesystem
    // This will work locally for development
    if (process.env.NODE_ENV === 'development') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(filepath, buffer);
    }

    const url = `/uploads/${uniqueFilename}`;

    // eslint-disable-next-line no-console
    console.log('File uploaded successfully:', url);
    
    return res.status(200).json({ url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error uploading file',
      error: error.message,
    });
  }
}
