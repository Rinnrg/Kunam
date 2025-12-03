# ✅ SOLUSI - Error 405 Method Not Allowed

## Masalah

```
POST https://kunam.vercel.app/api/upload 405 (Method Not Allowed)
```

## Penyebab

Di **Vercel**, filesystem adalah **read-only**. Tidak bisa menyimpan file ke folder `public/uploads/` seperti di local development.

## Solusi: Upload ke Cloudinary

Saya sudah update kode untuk:
- ✅ **Local development**: Upload ke `public/uploads/` (seperti biasa)
- ✅ **Production (Vercel)**: Upload ke **Cloudinary** (cloud storage)

---

## 🚀 CARA SETUP (5 Menit)

### 1. Buat Akun Cloudinary (GRATIS)

1. Buka: **https://cloudinary.com**
2. Klik **"Sign Up for Free"**
3. Daftar dengan email/Google
4. **Free tier**: 25GB storage + 25GB bandwidth

### 2. Dapatkan Credentials

Setelah login, di **Dashboard** Anda akan melihat:

```
Cloud Name: xxxxxxxxx
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

**COPY ketiga nilai ini!**

### 3. Add Environment Variables di Vercel

#### A. Buka Vercel Dashboard

1. Login: **https://vercel.com/dashboard**
2. Pilih project **Kunam**
3. Klik **Settings** → **Environment Variables**

#### B. Tambahkan 3 Variables

**Variable 1:**
```
Key: CLOUDINARY_CLOUD_NAME
Value: xxxxxxxxx (dari Cloudinary Dashboard)
Environments: ✅ Production, ✅ Preview, ✅ Development
```
Klik **Save**

**Variable 2:**
```
Key: CLOUDINARY_API_KEY
Value: 123456789012345 (dari Cloudinary Dashboard)
Environments: ✅ Production, ✅ Preview, ✅ Development
```
Klik **Save**

**Variable 3:**
```
Key: CLOUDINARY_API_SECRET
Value: AbCdEfGhIjKlMnOpQrStUvWxYz (dari Cloudinary Dashboard)
Environments: ✅ Production, ✅ Preview, ✅ Development
```
Klik **Save**

### 4. REDEPLOY (PENTING!)

Environment variables tidak otomatis terload!

1. Klik tab **Deployments**
2. Klik **⋮** (titik tiga) di deployment terakhir
3. Pilih **Redeploy**
4. (Optional) Centang **"Use existing Build Cache"** untuk lebih cepat
5. Klik **Redeploy**

### 5. Tunggu Deploy Selesai

Monitor di tab **Deployments**:
```
Building... → Deploying... → Ready ✅
```

### 6. Test Upload

1. Buka: **https://kunam.vercel.app/admin/produk**
2. Login sebagai admin
3. Klik **Tambah Produk**
4. Upload gambar
5. ✅ **Berhasil!** Gambar akan tersimpan di Cloudinary

---

## 📊 Verifikasi

### Cara 1: Test Upload
Upload gambar di admin panel. Jika berhasil, URL gambar akan seperti:
```
https://res.cloudinary.com/xxxxxxxxx/image/upload/v1234/kunam-products/abc.jpg
```

### Cara 2: Cek Build Logs
1. Vercel → Deployments → Pilih deployment terakhir
2. Klik **View Function Logs**
3. Cari error. Jika tidak ada → ✅ OK

### Cara 3: Cek Cloudinary Dashboard
1. Login ke Cloudinary
2. Klik **Media Library**
3. Folder **kunam-products** akan muncul setelah upload pertama

---

## 🆘 Troubleshooting

### ❌ Masih error 405 setelah setup
**Solusi**:
1. Pastikan **REDEPLOY** sudah dilakukan
2. Tunggu 2-3 menit untuk deployment selesai
3. Hard refresh browser (Ctrl+Shift+R)

### ❌ Error: "Upload not configured"
**Penyebab**: Environment variables belum diset atau belum redeploy  
**Solusi**:
1. Cek di Vercel → Settings → Environment Variables
2. Pastikan 3 variables sudah ada
3. **REDEPLOY**

### ❌ Error: "Cannot resolve module 'cloudinary'"
**Penyebab**: Package belum terinstall (seharusnya sudah ada)  
**Solusi**:
```bash
npm install cloudinary
git add package.json package-lock.json
git commit -m "Add cloudinary"
git push
```

### ❌ Credentials salah
**Solusi**:
1. Cek lagi di Cloudinary Dashboard
2. Copy paste dengan hati-hati (no extra spaces!)
3. Update di Vercel Environment Variables
4. **REDEPLOY**

---

## ✅ Checklist

```
Setup Cloudinary:
[ ] Buat akun di cloudinary.com
[ ] Dapatkan Cloud Name, API Key, API Secret

Setup Vercel:
[ ] Add 3 environment variables
[ ] Centang semua environments (Prod, Preview, Dev)
[ ] Save semua variables
[ ] REDEPLOY project

Test:
[ ] Deployment selesai (status: Ready)
[ ] Buka admin panel production
[ ] Upload gambar
[ ] Upload berhasil ✅
[ ] Gambar muncul di produk
[ ] Cek Cloudinary Media Library (gambar ada)
```

---

## 📸 Screenshot Guide

### Cloudinary Dashboard
Lihat bagian atas setelah login:
```
┌────────────────────────────────────┐
│ Account Details                    │
│ Cloud Name: xxxxxxxxx              │
│ API Key: 123456789012345           │
│ API Secret: ••••••••••••• [Show]   │
└────────────────────────────────────┘
```

### Vercel Environment Variables
```
Settings → Environment Variables → Add New

┌────────────────────────────────────┐
│ Key: CLOUDINARY_CLOUD_NAME         │
│ Value: xxxxxxxxx                   │
│ Environments:                      │
│ ☑ Production                       │
│ ☑ Preview                          │
│ ☑ Development                      │
│ [Save]                             │
└────────────────────────────────────┘
```

---

## 💡 Keuntungan Cloudinary

- ✅ **Gratis** 25GB storage (cukup untuk ribuan gambar)
- ✅ **Auto optimization** (WebP, compression, resize)
- ✅ **Global CDN** (loading super cepat)
- ✅ **Permanent storage** (tidak hilang seperti Vercel temp storage)
- ✅ **Image transformations** (resize on-the-fly via URL)
- ✅ **Backup automatic**

---

## 📞 Quick Links

- **Cloudinary**: https://cloudinary.com/console
- **Vercel**: https://vercel.com/dashboard
- **Dokumentasi Lengkap**: Lihat file `UPLOAD_SETUP.md`

---

## 🎉 Done!

Setelah setup selesai:
- ✅ Error 405 hilang
- ✅ Upload berfungsi di production
- ✅ Gambar tersimpan permanen di cloud
- ✅ Loading gambar super cepat (CDN)

**Total waktu setup: 5-10 menit**

---

**Happy Uploading! 🚀**
