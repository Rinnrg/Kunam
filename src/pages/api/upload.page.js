import formidable from 'formidable';
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

  // Setup upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure formidable
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    filename: (name, ext, part) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      return `${uniqueSuffix}${ext}`;
    },
  });

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
        // Get filename from uploaded file
        const filename = path.basename(uploadedFile.filepath);
        const url = `/uploads/${filename}`;

        // eslint-disable-next-line no-console
        console.log('File uploaded successfully:', url);

        res.status(200).json({ url });
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
