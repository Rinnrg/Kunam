import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { userAuthOptions } from '../auth/user/[...nextauth].page';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, userAuthOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password saat ini dan password baru diperlukan' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        provider: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Check if user signed up with OAuth
    if (user.provider !== 'credentials' && !user.password) {
      return res.status(400).json({ 
        message: 'Akun ini menggunakan login sosial. Tidak dapat mengubah password.' 
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password saat ini salah' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Change Password] Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
