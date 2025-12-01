/**
 * Database Connection Test Script
 * 
 * Test koneksi database dan basic operations
 * Usage: node scripts/test-db.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Test 2: Query Admin table
    console.log('2️⃣ Testing Admin table...');
    const adminCount = await prisma.admin.count();
    console.log(`✅ Found ${adminCount} admin(s) in database\n`);

    // Test 3: Query Produk table
    console.log('3️⃣ Testing Produk table...');
    const produkCount = await prisma.produk.count();
    console.log(`✅ Found ${produkCount} produk(s) in database\n`);

    // Test 4: Sample query
    console.log('4️⃣ Testing sample query...');
    const sampleProduk = await prisma.produk.findMany({
      take: 3,
      select: {
        id: true,
        nama: true,
        kategori: true,
      },
    });
    console.log('✅ Sample products:', JSON.stringify(sampleProduk, null, 2));
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('✅ Database connection is working properly');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
