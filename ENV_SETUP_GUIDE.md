# 🔐 Environment Variables Setup Guide

## Overview

Aplikasi ini membutuhkan environment variables untuk:
- ✅ Upload gambar ke Supabase Storage (production)
- ✅ Koneksi ke database
- ✅ Authentication

---

## 📝 Environment Variables yang Dibutuhkan

### 1. Supabase (Upload Gambar)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Cara Mendapatkan:**
1. Login ke https://supabase.com/dashboard
2. Pilih project Anda
3. Klik Settings (⚙️) → API
4. Copy ketiga nilai di atas

### 2. Database (Sudah Ada)

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 3. NextAuth (Sudah Ada)

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

---

## 🏠 Setup untuk Development (Local)

### File: `.env.local`

1. **Buat file** `.env.local` di root project (jika belum ada)
2. **Copy dari** `.env.example`
3. **Isi values** sesuai credentials Anda

```bash
# Database (sudah ada)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth (sudah ada)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Supabase (ISI INI!)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

4. **Save file**
5. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### ⚠️ PENTING:
- File `.env.local` **TIDAK** boleh di-commit ke Git
- Sudah ada di `.gitignore`
- Hanya untuk development lokal

---

## ☁️ Setup untuk Production (Vercel)

### Langkah-Langkah:

#### 1. Buka Vercel Dashboard
```
https://vercel.com/dashboard
```

#### 2. Pilih Project
- Klik project **Kunam**

#### 3. Masuk ke Settings
- Klik tab **Settings**
- Sidebar → **Environment Variables**

#### 4. Add Variables Satu Per Satu

**Variable 1: NEXT_PUBLIC_SUPABASE_URL**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co
Environments: 
  ✅ Production
  ✅ Preview
  ✅ Development
```
Klik **Save**

**Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: 
  ✅ Production
  ✅ Preview
  ✅ Development
```
Klik **Save**

**Variable 3: SUPABASE_SERVICE_ROLE_KEY**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: 
  ✅ Production
  ✅ Preview
  ✅ Development
```
Klik **Save**

#### 5. Redeploy (PENTING!)

Environment variables **tidak otomatis** terload. Harus redeploy!

**Cara Redeploy:**
1. Klik tab **Deployments**
2. Klik **⋮** (titik tiga) di deployment terakhir
3. Pilih **Redeploy**
4. Centang **"Use existing Build Cache"** (optional, lebih cepat)
5. Klik **Redeploy**

#### 6. Tunggu Deploy Selesai

Monitor di tab **Deployments**:
```
Building... → Deploying... → Ready ✅
```

---

## ✅ Verifikasi Setup

### A. Cek di Local

```bash
# Test koneksi Supabase
npm run test:supabase
```

**Output yang diharapkan:**
```
🔍 Checking Supabase Configuration...

Environment Variables:
✓ NEXT_PUBLIC_SUPABASE_URL: ✅ Set
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set
✓ SUPABASE_SERVICE_ROLE_KEY: ✅ Set

🔗 Testing Connection...
✅ Connection successful!

📦 Available Buckets:
✅ kunam-uploads (public)

✅ Bucket "kunam-uploads" is ready!
```

### B. Cek di Production

**Method 1: Via Build Logs**
1. Vercel → Deployments → Pilih deployment
2. Klik **View Function Logs** atau **Building**
3. Cari error terkait Supabase
4. Jika tidak ada error → ✅ Setup OK

**Method 2: Test Upload**
1. Buka: `https://your-domain.vercel.app/admin/produk`
2. Login sebagai admin
3. Tambah produk + upload gambar
4. Jika berhasil → ✅ Setup OK

**Method 3: Test Endpoint (Optional)**

Buat file `src/pages/api/test-env.page.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
    supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌',
  });
}
```

Buka: `https://your-domain.vercel.app/api/test-env`

Expected:
```json
{
  "supabaseUrl": "✅",
  "supabaseAnon": "✅",
  "serviceRole": "✅"
}
```

---

## 🔄 Update Environment Variables

Jika perlu update values:

### Local:
1. Edit `.env.local`
2. Save
3. Restart dev server

### Production:
1. Vercel → Settings → Environment Variables
2. Klik **⋮** di variable yang mau diubah
3. Pilih **Edit**
4. Update value
5. Save
6. **REDEPLOY** (penting!)

---

## 🆘 Troubleshooting

### ❌ Error: "Unable to resolve @supabase/supabase-js"
**Penyebab**: Package belum terinstall
**Solusi**:
```bash
npm install @supabase/supabase-js
git add package.json package-lock.json
git commit -m "Add Supabase"
git push
```

### ❌ Error: "Cloud storage not configured"
**Penyebab**: Environment variables belum diset di Vercel
**Solusi**: Ikuti langkah "Setup untuk Production" di atas

### ❌ Variables tidak terdeteksi di Vercel
**Penyebab**: Belum redeploy setelah add variables
**Solusi**: REDEPLOY adalah WAJIB!

### ❌ npm run test:supabase gagal
**Kemungkinan**:
1. `.env.local` belum dibuat/diisi
2. Credentials salah
3. Bucket belum dibuat
4. Package belum terinstall

**Debug**:
```bash
# Cek file ada
ls .env.local

# Cek isi (hide sensitive data!)
# cat .env.local

# Re-install package
npm install @supabase/supabase-js

# Test lagi
npm run test:supabase
```

---

## 📋 Checklist

### Setup Local:
- [ ] File `.env.local` dibuat
- [ ] Supabase credentials diisi
- [ ] Dev server direstart
- [ ] `npm run test:supabase` berhasil

### Setup Production:
- [ ] 3 environment variables ditambahkan di Vercel
- [ ] Semua environments (Prod, Preview, Dev) dicentang
- [ ] Variables disave
- [ ] Project di-REDEPLOY
- [ ] Build berhasil (tidak ada error)
- [ ] Test upload berhasil

---

## 🔐 Security Notes

### ✅ Safe untuk Public (Frontend):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Variables dengan prefix `NEXT_PUBLIC_` akan di-bundle ke frontend. Ini **OK** karena:
- Anon key punya limited permissions
- Dilindungi oleh Row Level Security (RLS) policies

### ⚠️ RAHASIA (Backend Only):
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Variables ini:
- Hanya ada di server/API routes
- **TIDAK** pernah terexpose ke frontend
- Punya full access ke Supabase

**JANGAN PERNAH**:
- Commit `.env.local` ke Git
- Share service_role key di public
- Hardcode keys di code

---

## 🎯 Quick Reference

| Variable | Where to Get | Used For |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Supabase connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Frontend auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Backend/upload |
| `DATABASE_URL` | Supabase/Neon → Database | Prisma connection |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | NextAuth session |

---

## 📞 Resources

- **Get Supabase Keys**: https://supabase.com/dashboard → Settings → API
- **Vercel Env Vars**: https://vercel.com/docs/projects/environment-variables
- **Next.js Env Vars**: https://nextjs.org/docs/basic-features/environment-variables

---

**Setup environment variables selesai! Lanjut test upload! 🚀**
