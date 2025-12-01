import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Test database connection
    await prisma.$connect();

    // Try to count admins
    const adminCount = await prisma.admin.count();

    // Get first admin (without password)
    const firstAdmin = await prisma.admin.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      adminCount,
      firstAdmin,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    await prisma.$disconnect();
  }
}
