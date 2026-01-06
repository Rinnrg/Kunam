import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name, username, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name || !username) {
      return res.status(400).json({ message: 'Email, password, nama lengkap, dan username wajib diisi' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Validate name length
    if (name.trim().length < 3) {
      return res.status(400).json({ message: 'Nama lengkap minimal 3 karakter' });
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, dan underscore' });
    }

    // Validate phone format (required)
    if (!phone) {
      return res.status(400).json({ message: 'Nomor telepon wajib diisi' });
    }
    
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ message: 'Format nomor telepon tidak valid' });
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        name,
        phone,
        provider: 'credentials',
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Registrasi berhasil',
      user,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Register API] Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
