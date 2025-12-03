import { createClient } from '@supabase/supabase-js';
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

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  const useSupabase = supabaseUrl && supabaseKey;

  // In production without Supabase, return error
  if (isProduction && !useSupabase) {
    return res.status(501).json({
      message: 'Cloud storage not configured - Supabase required for production',
      error: 'SUPABASE environment variables not set',
      setup: {
        step1: 'Create free project at https://supabase.com',
        step2: 'Create storage bucket named "kunam-uploads" (public)',
        step3: 'Get URL and keys from Settings → API',
        step4: 'Add to Vercel Environment Variables:',
        required: {
          NEXT_PUBLIC_SUPABASE_URL: 'your_project_url',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_anon_key',
        },
        step5: 'Redeploy',
      },
    });
  }

  // For local development, use local filesystem
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  if (!useSupabase && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const formOptions = useSupabase
    ? {
        maxFileSize: 10 * 1024 * 1024, // 10MB for Supabase
        keepExtensions: true,
      }
    : {
        uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB for local
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
        if (useSupabase) {
          // Upload to Supabase
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Read file
          const fileBuffer = fs.readFileSync(uploadedFile.filepath);
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const fileExt = path.extname(uploadedFile.originalFilename || uploadedFile.newFilename);
          const uniqueFilename = `${timestamp}-${randomString}${fileExt}`;
          const filePath = `products/${uniqueFilename}`;

          // Upload to Supabase Storage
          const { error } = await supabase.storage.from('kunam-uploads').upload(filePath, fileBuffer, {
            contentType: uploadedFile.mimetype || 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

          if (error) {
            throw new Error(`Supabase error: ${error.message}`);
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from('kunam-uploads').getPublicUrl(filePath);

          // eslint-disable-next-line no-console
          console.log('File uploaded to Supabase:', publicUrl);
          res.status(200).json({ url: publicUrl });
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
        console.error('Upload to storage error:', uploadError);
        res.status(500).json({ message: 'Error uploading to storage', error: uploadError.message });
        resolve();
      }
    });
  });
}
