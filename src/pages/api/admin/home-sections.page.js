import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth].page';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // GET - Public endpoint for fetching active sections
  if (req.method === 'GET' && !req.query.admin) {
    try {
      const sections = await prisma.homeSection.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      return res.status(200).json({ success: true, sections });
    } catch (error) {
      console.error('Error fetching home sections:', error);
      return res.status(500).json({ error: 'Gagal mengambil data sections' });
    }
  }

  // Protected routes - require admin authentication
  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const sections = await prisma.homeSection.findMany({
        orderBy: { order: 'asc' },
      });

      return res.status(200).json({ success: true, sections });
    } catch (error) {
      console.error('Error fetching sections:', error);
      return res.status(500).json({ error: 'Gagal mengambil data sections' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fields, files } = await parseForm(req);

      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
      const layoutType = Array.isArray(fields.layoutType) ? fields.layoutType[0] : fields.layoutType || 'slider';
      const columns = parseInt(Array.isArray(fields.columns) ? fields.columns[0] : fields.columns, 10) || 3;
      const autoplay = (Array.isArray(fields.autoplay) ? fields.autoplay[0] : fields.autoplay) === 'true';
      const interval = parseInt(Array.isArray(fields.interval) ? fields.interval[0] : fields.interval, 10) || 3000;
      const order = parseInt(Array.isArray(fields.order) ? fields.order[0] : fields.order, 10) || 0;
      const isActive = (Array.isArray(fields.isActive) ? fields.isActive[0] : fields.isActive) === 'true';

      // Handle uploaded images
      const uploadedImages = [];
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];

      imageFiles.forEach((file) => {
        if (file && file.filepath) {
          const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${path.extname(file.originalFilename || '.jpg')}`;
          const newPath = path.join(uploadDir, filename);

          fs.renameSync(file.filepath, newPath);
          uploadedImages.push(`/uploads/${filename}`);
        }
      });

      const section = await prisma.homeSection.create({
        data: {
          title,
          images: uploadedImages,
          layoutType,
          columns,
          autoplay,
          interval,
          order,
          isActive,
        },
      });

      return res.status(201).json({ success: true, section });
    } catch (error) {
      console.error('Error creating section:', error);
      return res.status(500).json({ error: 'Gagal membuat section' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { fields, files } = await parseForm(req);

      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
      const layoutType = Array.isArray(fields.layoutType) ? fields.layoutType[0] : fields.layoutType || 'slider';
      const columns = parseInt(Array.isArray(fields.columns) ? fields.columns[0] : fields.columns, 10) || 3;
      const autoplay = (Array.isArray(fields.autoplay) ? fields.autoplay[0] : fields.autoplay) === 'true';
      const interval = parseInt(Array.isArray(fields.interval) ? fields.interval[0] : fields.interval, 10) || 3000;
      const order = parseInt(Array.isArray(fields.order) ? fields.order[0] : fields.order, 10) || 0;
      const isActive = (Array.isArray(fields.isActive) ? fields.isActive[0] : fields.isActive) === 'true';

      // Get existing images
      let existingImages = [];
      const existingImagesField = Array.isArray(fields.existingImages) ? fields.existingImages[0] : fields.existingImages;
      if (existingImagesField) {
        existingImages = JSON.parse(existingImagesField);
      }

      // Handle new uploaded images
      const newImages = [];
      let imageFiles = [];
      if (Array.isArray(files.images)) {
        imageFiles = files.images;
      } else if (files.images) {
        imageFiles = [files.images];
      }

      imageFiles.forEach((file) => {
        if (file && file.filepath) {
          const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${path.extname(file.originalFilename || '.jpg')}`;
          const newPath = path.join(uploadDir, filename);

          fs.renameSync(file.filepath, newPath);
          newImages.push(`/uploads/${filename}`);
        }
      });

      const allImages = [...existingImages, ...newImages];

      const section = await prisma.homeSection.update({
        where: { id },
        data: {
          title,
          images: allImages,
          layoutType,
          columns,
          autoplay,
          interval,
          order,
          isActive,
        },
      });

      return res.status(200).json({ success: true, section });
    } catch (error) {
      console.error('Error updating section:', error);
      return res.status(500).json({ error: 'Gagal mengupdate section' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      // Get section to delete images
      const section = await prisma.homeSection.findUnique({
        where: { id },
      });

      if (section) {
        // Delete image files
        section.images.forEach((imagePath) => {
          const fullPath = path.join(process.cwd(), 'public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });

        // Delete database record
        await prisma.homeSection.delete({
          where: { id },
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting section:', error);
      return res.status(500).json({ error: 'Gagal menghapus section' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
