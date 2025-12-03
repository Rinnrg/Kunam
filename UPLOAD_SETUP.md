# 🚀 Setup Upload Gambar - Cloudinary

## Overview

Aplikasi ini menggunakan:
- **Development (Local)**: Gambar disimpan di folder `public/uploads/`
- **Production (Vercel)**: Gambar diupload ke **Cloudinary** (cloud storage)

---

## ⚡ Quick Setup (5 Menit)

### 1️⃣ Buat Akun Cloudinary (GRATIS)

1. Buka: https://cloudinary.com
2. Klik **"Sign Up for Free"**
3. Sign up dengan email atau Google
4. **Free tier**: 25GB storage + 25GB bandwidth/bulan

### 2️⃣ Dapatkan Credentials

Setelah login:

1. Anda akan langsung melihat **Dashboard**
2. Di bagian atas ada **Account Details**:

```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

3. Copy ketiga nilai ini!

### 3️⃣ Setup Environment Variables

#### **A. Untuk Local Development**

Edit file `.env.local` (buat jika belum ada):

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz"
```

**Restart dev server:**
```bash
npm run dev
```

#### **B. Untuk Production (Vercel)**

1. Buka: https://vercel.com/dashboard
2. Pilih project **Kunam**
3. Klik **Settings** → **Environment Variables**
4. Tambahkan 3 variables:

| Key | Value | Environments |
|-----|-------|--------------|
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | ✅ Prod, ✅ Preview, ✅ Dev |
| `CLOUDINARY_API_KEY` | `123456789012345` | ✅ Prod, ✅ Preview, ✅ Dev |
| `CLOUDINARY_API_SECRET` | `AbCdEfGh...` | ✅ Prod, ✅ Preview, ✅ Dev |

5. Klik **Save** untuk setiap variable
6. **PENTING**: Klik tab **Deployments** → ⋮ → **Redeploy**

### 4️⃣ Test Upload

**Local:**
```bash
npm run dev
```
- Buka: http://localhost:3000/admin/produk
- Login sebagai admin
- Tambah produk + upload gambar
- ✅ Gambar disimpan di `public/uploads/`

**Production:**
- Tunggu Vercel deployment selesai
- Buka: https://kunam.vercel.app/admin/produk
- Login sebagai admin
- Tambah produk + upload gambar
- ✅ Gambar diupload ke Cloudinary

---

## 📊 Cara Kerja

### Development (Local):
```
Upload Form → API /api/upload → public/uploads/ → Database (URL)
```
URL format: `/uploads/1234567890-123.jpg`

### Production (Vercel):
```
Upload Form → API /api/upload → Cloudinary Cloud → Database (URL)
```
URL format: `https://res.cloudinary.com/your_cloud/image/upload/v1234/kunam-products/abc123.jpg`

---

## ✅ Checklist Setup

### Cloudinary:
- [ ] Buat akun di https://cloudinary.com
- [ ] Dapatkan Cloud Name, API Key, API Secret

### Local:
- [ ] File `.env.local` dibuat
- [ ] 3 environment variables diisi
- [ ] Dev server direstart
- [ ] Test upload berhasil

### Production:
- [ ] 3 environment variables ditambahkan di Vercel
- [ ] Semua environments dicentang
- [ ] Variables disave
- [ ] Project di-REDEPLOY
- [ ] Test upload berhasil

---

## 🆘 Troubleshooting

### ❌ Error: "Upload not configured"
**Penyebab**: Environment variables belum diset di Vercel  
**Solusi**: 
1. Add 3 env vars di Vercel (lihat langkah 3B)
2. **REDEPLOY** (penting!)

### ❌ Error: "Cannot resolve module 'cloudinary'"
**Penyebab**: Package belum terinstall  
**Solusi**:
```bash
npm install cloudinary
```

### ❌ Upload gagal di Cloudinary
**Kemungkinan**:
1. Credentials salah → Cek di Cloudinary Dashboard
2. Free tier limit exceeded → Cek usage di Dashboard
3. Network error → Retry

### ❌ Gambar tidak muncul di production
**Cek**:
1. Apakah upload sukses? (lihat response API)
2. Apakah URL tersimpan di database?
3. Cek Cloudinary Dashboard → Media Library

---

## 🔐 Security

### ✅ Safe untuk Production:
- Cloudinary credentials disimpan sebagai environment variables
- Tidak di-commit ke Git
- API Secret tidak terexpose ke frontend

### ⚠️ JANGAN:
- Commit `.env.local` ke Git (sudah di `.gitignore`)
- Share API Secret di public
- Hardcode credentials di code

---

## 📱 Cloudinary Features

Otomatis optimasi gambar:
- ✅ Auto format (WebP untuk browser yang support)
- ✅ Auto resize (max 1200x1200px)
- ✅ Auto quality optimization
- ✅ CDN delivery (super cepat)

---

## 💡 Tips

1. **Free tier cukup** untuk ribuan gambar
2. **Automatic backup** - gambar disimpan permanen
3. **Global CDN** - loading cepat dari mana saja
4. **Image transformation** - bisa resize/crop on-the-fly via URL

---

## 📞 Resources

- **Cloudinary Dashboard**: https://cloudinary.com/console
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Vercel Env Vars**: https://vercel.com/docs/projects/environment-variables

---

## 🎯 Summary

1. **Buat akun Cloudinary** (gratis)
2. **Copy credentials** dari Dashboard
3. **Add ke .env.local** (local)
4. **Add ke Vercel** (production)
5. **REDEPLOY Vercel**
6. **Test upload** ✅

**Total waktu: ~5 menit**

---

**Upload siap! Gambar otomatis ke cloud! 🎉**
