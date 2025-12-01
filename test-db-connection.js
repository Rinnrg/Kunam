// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    
    // Try a simple query
    const adminCount = await prisma.admin.count();
    console.log(`✅ Found ${adminCount} admin(s) in database`);
    
    // Try to fetch one admin (if exists)
    const admin = await prisma.admin.findFirst();
    if (admin) {
      console.log('✅ Sample admin:', { id: admin.id, email: admin.email, name: admin.name });
    } else {
      console.log('⚠️  No admin found in database');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\nDisconnected from database');
  }
}

testConnection();
