/**
 * Script untuk recalculate rating dan totalReviews untuk semua produk
 * Jalankan script ini setelah migrasi database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateRatings() {
  console.log('🔄 Starting rating recalculation...\n');

  try {
    // Get all products
    const products = await prisma.produk.findMany({
      select: { id: true, nama: true },
    });

    console.log(`Found ${products.length} products\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Get all reviews for this product
      const reviews = await prisma.reviews.findMany({
        where: { produkId: product.id },
        select: { rating: true },
      });

      if (reviews.length === 0) {
        console.log(`⏭️  ${product.nama}: No reviews, skipping`);
        skipped++;
        continue;
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Update product
      await prisma.produk.update({
        where: { id: product.id },
        data: {
          rating: Number(averageRating.toFixed(1)),
          totalReviews: reviews.length,
        },
      });

      console.log(`✅ ${product.nama}: Rating ${averageRating.toFixed(1)} (${reviews.length} reviews)`);
      updated++;
    }

    console.log('\n✨ Rating recalculation complete!');
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products (no reviews)`);
  } catch (error) {
    console.error('❌ Error recalculating ratings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateRatings();
