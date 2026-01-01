import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
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

    // Validate phone format (optional but if provided must be valid)
    if (phone) {
      const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return res.status(400).json({ message: 'Format nomor telepon tidak valid' });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
        provider: 'credentials',
      },
      select: {
        id: true,
        email: true,
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
