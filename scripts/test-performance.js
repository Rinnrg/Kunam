/**
 * Performance Testing Script
 * Run this to test database query performance
 * 
 * Usage: node scripts/test-performance.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Track query metrics
const queryMetrics = [];

prisma.$on('query', (e) => {
  queryMetrics.push({
    query: e.query.substring(0, 100) + '...',
    duration: e.duration,
  });
});

async function testQueries() {
  console.log('🚀 Starting Performance Tests...\n');

  // Test 1: Get all products (unoptimized)
  console.log('📊 Test 1: Fetch All Products (Full)');
  const start1 = Date.now();
  const allProducts = await prisma.produk.findMany();
  const duration1 = Date.now() - start1;
  console.log(`  ⏱️  Duration: ${duration1}ms`);
  console.log(`  📦 Records: ${allProducts.length}`);
  console.log(`  💾 Estimated Size: ~${JSON.stringify(allProducts).length / 1024}KB\n`);

  // Test 2: Get products with select (optimized)
  console.log('📊 Test 2: Fetch Products (Optimized with SELECT)');
  const start2 = Date.now();
  const optimizedProducts = await prisma.produk.findMany({
    select: {
      id: true,
      nama: true,
      kategori: true,
      harga: true,
      diskon: true,
      gambar: true,
    },
  });
  const duration2 = Date.now() - start2;
  console.log(`  ⏱️  Duration: ${duration2}ms`);
  console.log(`  📦 Records: ${optimizedProducts.length}`);
  console.log(`  💾 Estimated Size: ~${JSON.stringify(optimizedProducts).length / 1024}KB`);
  console.log(`  🚀 Improvement: ${((duration1 - duration2) / duration1 * 100).toFixed(2)}% faster`);
  console.log(`  💾 Size Reduction: ${((1 - JSON.stringify(optimizedProducts).length / JSON.stringify(allProducts).length) * 100).toFixed(2)}%\n`);

  // Test 3: Get products with limit
  console.log('📊 Test 3: Fetch Products (With Limit 20)');
  const start3 = Date.now();
  const limitedProducts = await prisma.produk.findMany({
    select: {
      id: true,
      nama: true,
      kategori: true,
      harga: true,
      diskon: true,
      gambar: true,
    },
    take: 20,
  });
  const duration3 = Date.now() - start3;
  console.log(`  ⏱️  Duration: ${duration3}ms`);
  console.log(`  📦 Records: ${limitedProducts.length}`);
  console.log(`  🚀 Improvement: ${((duration1 - duration3) / duration1 * 100).toFixed(2)}% faster than full fetch\n`);

  // Test 4: Category filter
  console.log('📊 Test 4: Fetch by Category');
  const start4 = Date.now();
  const categoryProducts = await prisma.produk.findMany({
    where: { kategori: 'T-Shirt' },
    select: {
      id: true,
      nama: true,
      harga: true,
      diskon: true,
    },
  });
  const duration4 = Date.now() - start4;
  console.log(`  ⏱️  Duration: ${duration4}ms`);
  console.log(`  📦 Records: ${categoryProducts.length}\n`);

  // Test 5: Search performance
  console.log('📊 Test 5: Search Query');
  const start5 = Date.now();
  const searchResults = await prisma.produk.findMany({
    where: {
      OR: [
        { nama: { contains: 'shirt', mode: 'insensitive' } },
        { kategori: { contains: 'shirt', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nama: true,
      kategori: true,
      harga: true,
    },
    take: 10,
  });
  const duration5 = Date.now() - start5;
  console.log(`  ⏱️  Duration: ${duration5}ms`);
  console.log(`  📦 Records: ${searchResults.length}\n`);

  // Summary
  console.log('📊 Query Performance Summary:');
  console.log('═══════════════════════════════════════════════');
  queryMetrics.forEach((metric, index) => {
    console.log(`Query ${index + 1}: ${metric.duration}ms`);
  });

  console.log('\n✅ Performance tests completed!');
  console.log('\n💡 Recommendations:');
  console.log('  - Use SELECT to fetch only needed fields');
  console.log('  - Implement pagination with TAKE/SKIP');
  console.log('  - Add caching for frequently accessed data');
  console.log('  - Monitor slow queries in production');
}

// Run tests
testQueries()
  .catch((e) => {
    console.error('❌ Error running tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
