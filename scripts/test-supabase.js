// Test Supabase Connection
// Run: node scripts/test-supabase.js

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Checking Supabase Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set');
console.log('✓ SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Not set');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Supabase not configured!');
  console.log('\n📝 Setup Instructions:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Get credentials from: https://supabase.com/dashboard');
  console.log('3. Add them to .env.local');
  console.log('4. Read QUICK_START_SUPABASE.md for detailed steps\n');
  process.exit(1);
}

// Test connection
async function testConnection() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n🔗 Testing Connection...');

    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('❌ Connection Error:', bucketsError.message);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('\n📦 Available Buckets:');

    if (buckets.length === 0) {
      console.log('⚠️  No buckets found!');
      console.log('   Create bucket "kunam-uploads" in Supabase Dashboard');
    } else {
      buckets.forEach((bucket) => {
        const isCorrect = bucket.name === 'kunam-uploads';
        const icon = isCorrect ? '✅' : '⚠️';
        console.log(`${icon} ${bucket.name}${bucket.public ? ' (public)' : ' (private)'}`);
      });
    }

    // Check if kunam-uploads exists
    const hasCorrectBucket = buckets.some((b) => b.name === 'kunam-uploads');

    if (!hasCorrectBucket) {
      console.log('\n❌ Bucket "kunam-uploads" not found!');
      console.log('\n📝 Create it:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Storage → Create bucket');
      console.log('3. Name: kunam-uploads');
      console.log('4. Make it PUBLIC ✅');
    } else {
      // Test file listing
      const { data: files, error: filesError } = await supabase.storage.from('kunam-uploads').list('products', {
        limit: 5,
      });

      if (filesError) {
        console.log('\n⚠️  Bucket exists but cannot list files:', filesError.message);
        console.log('   Check bucket policies in Supabase Dashboard');
      } else {
        console.log('\n✅ Bucket "kunam-uploads" is ready!');
        console.log(`📁 Files in /products: ${files.length} files`);

        if (files.length > 0) {
          console.log('\nRecent uploads:');
          files.slice(0, 3).forEach((file) => {
            console.log(`   - ${file.name}`);
          });
        }
      }
    }

    console.log('\n✨ Supabase is ready for uploads!\n');
  } catch (error) {
    console.log('\n❌ Error:', error.message);

    if (error.message.includes('supabase-js')) {
      console.log('\n📦 Install package:');
      console.log('   npm install @supabase/supabase-js\n');
    }
  }
}

testConnection();
