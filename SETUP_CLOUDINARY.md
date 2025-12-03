# Setup Upload untuk Vercel - CLOUDINARY (WAJIB)

## ⚠️ Kenapa Upload Gagal?

Vercel serverless functions **TIDAK BISA** menyimpan file permanen ke filesystem.
File yang di-upload akan **HILANG** setelah fungsi selesai.

**Solusi**: Gunakan Cloudinary (cloud storage)

---

## ✅ Setup Cloudinary (5 menit)

### 1. Daftar Cloudinary (GRATIS)

**Link**: https://cloudinary.com/users/register/free

- ✅ No credit card required
- ✅ 25 GB storage gratis
- ✅ 25 GB bandwidth/bulan
- ✅ Auto image optimization
- ✅ Global CDN

### 2. Dapatkan Credentials

Setelah login:

1. Buka **Dashboard** (https://console.cloudinary.com/)
2. Di bagian **Account Details**, copy 3 values:
   - **Cloud Name**: (contoh: `dxxx123`)
   - **API Key**: (contoh: `123456789012345`)
   - **API Secret**: (contoh: `abcdefgh-1234567890`)

### 3. Tambahkan ke Vercel

**Via Vercel Dashboard**:

1. Buka: https://vercel.com/dashboard
2. Pilih project **Kunam**
3. Klik **Settings**
4. Klik **Environment Variables** di sidebar
5. Add 3 variables baru:

```
Name: CLOUDINARY_CLOUD_NAME
Value: [paste cloud name kamu]
Environment: Production, Preview, Development
```

```
Name: CLOUDINARY_API_KEY
Value: [paste API key kamu]
Environment: Production, Preview, Development
```

```
Name: CLOUDINARY_API_SECRET
Value: [paste API secret kamu]
Environment: Production, Preview, Development
```

6. Klik **Save** untuk setiap variable

### 4. Redeploy

**Otomatis**: Vercel akan redeploy setelah environment variables disimpan.

**Atau manual**:
```bash
git commit --allow-empty -m "trigger redeploy with Cloudinary"
git push origin main
```

### 5. Test Upload

1. Buka: https://kunam.vercel.app/admin/produk/create
2. Login sebagai admin
3. Pilih gambar
4. Upload
5. ✅ Seharusnya berhasil!

---

## 📊 Cara Kerja

### Development (Local)
- Upload ke `/public/uploads/` (local filesystem)
- Tidak perlu Cloudinary

### Production (Vercel)
- Upload ke Cloudinary
- File tersimpan permanent
- URL: `https://res.cloudinary.com/[cloud_name]/...`

### Auto Detection
Code otomatis detect environment:
```javascript
if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Use Cloudinary
} else {
  // Use local (dev only)
}
```

---

## 🔍 Troubleshooting

### Upload masih error?

**Check 1**: Environment variables sudah di-set?
- Vercel Dashboard → Settings → Environment Variables
- Pastikan 3 variables ada: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Check 2**: Typo di environment variable name?
- Harus exact match (case sensitive)
- Tidak boleh ada spasi

**Check 3**: API Secret complete?
- Secret biasanya panjang dan ada `-` (dash)
- Copy full string

**Check 4**: Sudah redeploy?
- Vercel perlu redeploy setelah env vars ditambahkan
- Check Deployments tab

### Lihat error detail

**Browser Console**:
```
F12 → Console tab → Lihat error messages
```

**Vercel Logs**:
```
Vercel Dashboard → Deployments → [Latest] → Functions → upload
```

---

## 💡 Tips

### Batasi Ukuran File
Upload di-limit 10MB per file. Untuk gambar produk:
- Recommended: max 2048x2048 px
- Compress sebelum upload
- Format: JPG/PNG

### Monitor Usage
Dashboard Cloudinary → Media Library
- Lihat semua uploaded files
- Check storage usage

### Organization
Files auto-organized di folder `kunam-products` di Cloudinary.

---

## ✨ Selesai!

Setelah setup Cloudinary:
- ✅ Upload akan berfungsi di production
- ✅ File tersimpan permanen
- ✅ Cepat dengan CDN
- ✅ Auto optimized

**Butuh bantuan?**
- Cloudinary docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/
