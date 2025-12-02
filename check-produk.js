// Check produk in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProduk() {
  try {
    console.log('🔍 Checking produk in database...\n');

    const count = await prisma.produk.count();
    console.log(`📊 Total produk: ${count}\n`);

    if (count === 0) {
      console.log('❌ No produk found in database!');
      console.log('\n💡 You need to add produk via admin panel:');
      console.log('   1. Go to http://localhost:3000/admin/login');
      console.log('   2. Login with your admin credentials');
      console.log('   3. Go to Produk section');
      console.log('   4. Click "Tambah Produk"');
      console.log('   5. Fill in the form and save\n');
    } else {
      console.log('✅ Produk found! Listing first 5:\n');
      const produk = await prisma.produk.findMany({
        take: 5,
        orderBy: { tanggalDibuat: 'desc' },
      });

      produk.forEach((p, index) => {
        console.log(`${index + 1}. ${p.nama}`);
        console.log(`   - Kategori: ${p.kategori}`);
        console.log(`   - Harga: Rp ${p.harga.toLocaleString('id-ID')}`);
        console.log(`   - Stok: ${p.stok}`);
        console.log(`   - Featured: ${p.produkUnggulan ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkProduk();
