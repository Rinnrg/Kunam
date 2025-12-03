# 📸 Upload Gambar Produk - Panduan Sederhana

## ✅ Alur Upload yang Baru (Tanpa Supabase Storage)

Saya sudah **merombak total** sistem upload agar **lebih sederhana**:

### 🎯 Cara Kerja Baru:

```
User → Upload Gambar → API /upload → public/uploads/ → Database (URL)
```

**Keuntungan:**
- ✅ **Tidak perlu** Supabase Storage
- ✅ **Tidak perlu** setup bucket, policies, dll
- ✅ **Tidak perlu** environment variables tambahan
- ✅ **Simpel**: Gambar langsung di folder `public/uploads/`
- ✅ **URL**: Disimpan di database (bukan file binary)

---

## 📂 Struktur File

```
public/
├── uploads/                    ← Folder untuk gambar produk
│   ├── 1701234567890-123456789.jpg
│   ├── 1701234567890-987654321.png
│   └── ...
└── ...
```

**Database hanya menyimpan URL:**
```
/uploads/1701234567890-123456789.jpg
```

---

## 🚀 Cara Menggunakan

### 1. Development (Local)

```bash
# Jalankan dev server
npm run dev
```

1. Buka: http://localhost:3000/admin/produk
2. Login sebagai admin
3. Klik "Tambah Produk"
4. Upload gambar
5. ✅ Gambar disimpan di `public/uploads/`
6. ✅ URL disimpan ke database

### 2. Production (Vercel)

**⚠️ PENTING:** Vercel adalah platform **serverless**, file yang diupload **tidak persisten**.

#### **Solusi untuk Production:**

**Opsi A: Menggunakan Vercel Blob Storage (Recommended)**

Vercel menyediakan blob storage gratis:
- Free: 500MB storage, 2GB bandwidth
- Mudah setup (built-in dengan Vercel)

**Cara Setup:**
1. Install package:
   ```bash
   npm install @vercel/blob
   ```

2. Add environment variable di Vercel:
   - Otomatis tersedia di Vercel projects
   - Tidak perlu setup manual

3. Ubah API upload (opsional - bisa saya bantu)

**Opsi B: Tetap Pakai Folder (Sementara)**

Upload tetap berfungsi, tapi gambar akan **hilang saat redeploy**.

**Opsi C: Cloudinary (Gratis 25GB)**

Setup mudah, dokumentasi sudah ada di `.env.example`.

---

## 🔧 Konfigurasi

### File: `src/pages/api/upload.page.js`

```javascript
// Sudah dikonfigurasi:
- Max file size: 10MB
- Format: Semua gambar (jpg, png, webp, etc)
- Auto-generate unique filename
- Upload ke: public/uploads/
```

### Environment Variables

**Tidak perlu environment variables tambahan!** 🎉

Cukup yang sudah ada:
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
```

---

## 📊 Database Schema

Tabel `Product` (sudah ada di Prisma schema):

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Float
  image       String?  ← URL gambar: "/uploads/123456.jpg"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Field `image`** menyimpan **URL relatif**, bukan file binary.

---

## 🧪 Testing

### Test Upload:

```bash
# 1. Start dev server
npm run dev

# 2. Upload gambar via admin panel
# 3. Cek folder public/uploads/
ls public/uploads

# 4. Cek database
# URL gambar sudah tersimpan di field `image`
```

### Test Tampilan:

```jsx
// Di component:
<img src={product.image} alt={product.name} />

// Hasil:
<img src="/uploads/1701234567890-123456789.jpg" alt="Product Name" />
```

Next.js akan serve file dari `public/uploads/` secara otomatis.

---

## ⚠️ Catatan Penting

### Local Development:
✅ **Aman**: File disimpan di folder `public/uploads/`  
✅ **Persisten**: File tidak hilang  
✅ **Backup**: Bisa di-commit ke Git (optional)

### Production (Vercel):
⚠️ **Tidak Persisten**: File hilang saat redeploy  
⚠️ **Solusi**: Gunakan Vercel Blob atau Cloudinary

---

## 🔄 Migration dari Supabase Storage

Jika sudah ada data:

1. **Download semua gambar** dari Supabase Storage
2. **Upload ke folder** `public/uploads/`
3. **Update database** dengan URL baru:
   ```sql
   -- Ganti URL Supabase dengan URL lokal
   UPDATE Product 
   SET image = REPLACE(
     image, 
     'https://xxx.supabase.co/storage/v1/object/public/kunam-uploads/products/',
     '/uploads/'
   );
   ```

---

## 🚀 Upgrade ke Vercel Blob (Optional)

Jika mau upgrade untuk production, beritahu saya. Saya akan:

1. Install `@vercel/blob`
2. Update API `/upload` untuk support Vercel Blob
3. Auto-detect environment (local vs production)
4. Local tetap pakai folder, production pakai Vercel Blob

**Estimasi**: 5 menit

---

## 📋 Checklist

- [x] Hapus dependency `@supabase/supabase-js`
- [x] Simplify upload API
- [x] Tidak perlu environment variables tambahan
- [x] Upload langsung ke `public/uploads/`
- [x] URL disimpan ke database
- [ ] Test upload di local
- [ ] (Optional) Setup Vercel Blob untuk production

---

## 🆘 Troubleshooting

### Error: "Error uploading file"
- Cek permission folder `public/uploads/`
- Cek disk space

### Gambar tidak muncul
- Cek URL di database: harus `/uploads/filename.jpg`
- Cek file ada di `public/uploads/`
- Cek Next.js dev server running

### Upload timeout
- Cek ukuran file (max 10MB)
- Cek network connection

---

## 📞 Resources

- **Next.js Static Files**: https://nextjs.org/docs/basic-features/static-file-serving
- **Vercel Blob Storage**: https://vercel.com/docs/storage/vercel-blob
- **Formidable Docs**: https://github.com/node-formidable/formidable

---

**Sekarang upload gambar jauh lebih sederhana! 🎉**

**Tidak perlu setup Supabase Storage lagi!** ✅
