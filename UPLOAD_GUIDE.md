# 🚀 Setup Upload Gambar Produk

## Status Build

✅ **Build error sudah diperbaiki!**  
✅ Code sudah di-push & deployed ke Vercel

---

## ⚠️ Penting: Upload Memerlukan Cloudinary

Di **production (Vercel)**, filesystem adalah **read-only**.  
Tidak bisa menyimpan file ke folder seperti di local.

**Solusi**: Upload ke **Cloudinary** (cloud storage gratis)

---

## 🎯 Setup Cloudinary (5 Menit)

### 1. Buat Akun (Gratis)

https://cloudinary.com

- Klik "Sign Up for Free"
- Daftar dengan email atau Google
- **Gratis**: 25GB storage + 25GB bandwidth/bulan

### 2. Dapatkan Credentials

Setelah login, di **Dashboard** akan terlihat:

```
Cloud Name: xxxxxxxxx
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

**Copy ketiga nilai ini!**

### 3. Setup di Vercel

#### A. Buka Vercel Dashboard
https://vercel.com/dashboard

#### B. Pilih Project Kunam
Settings → Environment Variables

#### C. Tambahkan 3 Variables

**Variable 1:**
```
Key: CLOUDINARY_CLOUD_NAME
Value: xxxxxxxxx (Cloud Name dari Cloudinary)
Environments: ✅ Production ✅ Preview ✅ Development
```
Klik **Save**

**Variable 2:**
```
Key: CLOUDINARY_API_KEY
Value: 123456789012345 (API Key dari Cloudinary)
Environments: ✅ Production ✅ Preview ✅ Development
```
Klik **Save**

**Variable 3:**
```
Key: CLOUDINARY_API_SECRET
Value: AbCdEfGh... (API Secret dari Cloudinary)
Environments: ✅ Production ✅ Preview ✅ Development
```
Klik **Save**

### 4. REDEPLOY (PENTING!)

Environment variables tidak auto-load!

1. Tab **Deployments**
2. Klik **⋮** (menu) di deployment terakhir
3. Pilih **Redeploy**
4. Tunggu 2-3 menit sampai selesai

### 5. Test Upload

1. Buka: https://kunam.vercel.app/admin/produk
2. Login sebagai admin
3. Tambah produk baru
4. Upload gambar
5. ✅ **Berhasil!**

---

## 📊 Cara Kerja

### Local Development
```
Upload Form → API → public/uploads/ → Database
URL: /uploads/image.jpg
```

### Production (Vercel + Cloudinary)
```
Upload Form → API → Cloudinary Cloud → Database
URL: https://res.cloudinary.com/.../kunam-products/image.jpg
```

---

## 💡 Keuntungan Cloudinary

- ✅ **Permanent storage** - Gambar tidak hilang
- ✅ **Auto optimization** - WebP, compression, resize otomatis
- ✅ **Global CDN** - Loading super cepat dari mana saja
- ✅ **Gratis 25GB** - Cukup untuk ribuan gambar
- ✅ **Image transformations** - Resize/crop on-the-fly via URL

---

## 🆘 Troubleshooting

### ❌ Upload gagal dengan error "Upload not configured"

**Penyebab**: Environment variables belum diset di Vercel

**Solusi**:
1. Pastikan 3 variables sudah ditambahkan
2. Pastikan sudah **REDEPLOY**
3. Tunggu deployment selesai

### ❌ Credentials tidak valid

**Solusi**:
1. Double check di Cloudinary Dashboard
2. Copy paste ulang (no extra spaces!)
3. Update di Vercel Environment Variables
4. **REDEPLOY**

### ❌ Masih tidak bisa upload setelah setup

**Cek**:
1. Apakah deployment sudah selesai? (status: Ready)
2. Apakah 3 variables benar-benar tersimpan?
3. Hard refresh browser (Ctrl+Shift+R)
4. Cek browser console untuk error message

---

## ✅ Checklist

```
Cloudinary:
[ ] Buat akun di cloudinary.com
[ ] Login ke dashboard
[ ] Copy Cloud Name, API Key, API Secret

Vercel:
[ ] Buka Settings → Environment Variables
[ ] Tambahkan CLOUDINARY_CLOUD_NAME
[ ] Tambahkan CLOUDINARY_API_KEY
[ ] Tambahkan CLOUDINARY_API_SECRET
[ ] Centang semua environments
[ ] Save semua variables
[ ] Tab Deployments → Redeploy
[ ] Tunggu deployment selesai (Ready)

Test:
[ ] Buka admin panel production
[ ] Login sebagai admin
[ ] Upload gambar produk
[ ] Upload berhasil ✅
[ ] Gambar muncul di produk
```

---

## 📱 Links

- **Cloudinary Dashboard**: https://cloudinary.com/console
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Site**: https://kunam.vercel.app

---

## 📝 Local Development

Untuk development lokal, **tidak perlu** setup Cloudinary.  
Gambar otomatis disimpan ke `public/uploads/`

```bash
npm run dev
# Buka: http://localhost:3000/admin/produk
# Upload gambar → tersimpan di public/uploads/
```

---

**Setup займет 5-10 минут. Setelah itu upload gambar akan berfungsi sempurna! 🎉**
