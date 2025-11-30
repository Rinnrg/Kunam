import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    filename: (name, ext) => {
      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      return `${uniqueSuffix}${ext}`;
    },
  });

  return new Promise((resolve) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        res.status(500).json({ message: 'Error uploading file' });
        resolve();
        return;
      }

      const { file } = files;
      if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        resolve();
        return;
      }

      // Handle both single file and array of files
      const uploadedFile = Array.isArray(file) ? file[0] : file;
      
      // Get the relative path for the URL
      const filename = path.basename(uploadedFile.filepath);
      const url = `/uploads/${filename}`;

      res.status(200).json({ url });
      resolve();
    });
  });
}
