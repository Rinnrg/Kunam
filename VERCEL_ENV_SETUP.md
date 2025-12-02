# 🚀 ENVIRONMENT VARIABLES UNTUK VERCEL

## 📋 Copy-Paste Variables Ini ke Vercel Dashboard

### 1. DATABASE_URL
```
postgresql://postgres:indrarakayoga@db.qwqnxasybubbyjqexjde.supabase.co:5432/postgres
```
- **Environment:** Production, Preview, Development (centang semua)

---

### 2. NEXTAUTH_URL

**Untuk Production:**
```
https://kunam.vercel.app
```
- **Environment:** Production (centang Production saja)

**Untuk Preview:**
```
https://kunam-git-${VERCEL_GIT_COMMIT_REF}-rinnrg.vercel.app
```
- **Environment:** Preview (centang Preview saja)

**Untuk Development:**
```
http://localhost:3000
```
- **Environment:** Development (centang Development saja)

---

### 3. NEXTAUTH_SECRET
```
WT+kD2r2WHWKVeMFCUFUxejvx+5rfl7WZ4V2PQUloqY=
```
- **Environment:** Production, Preview, Development (centang semua)

---

## 📍 Cara Setting di Vercel Dashboard

### Langkah-langkah:

1. **Buka Vercel Dashboard:**
   ```
   https://vercel.com/rinnrg/kunam/settings/environment-variables
   ```

2. **Tambah Variable Pertama - DATABASE_URL:**
   - Click **"Add New"**
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:indrarakayoga@db.qwqnxasybubbyjqexjde.supabase.co:5432/postgres`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - Click **"Save"**

3. **Tambah Variable Kedua - NEXTAUTH_URL (Production):**
   - Click **"Add New"**
   - **Key:** `NEXTAUTH_URL`
   - **Value:** `https://kunam.vercel.app`
   - **Environments:** ✅ Production
   - Click **"Save"**

4. **Tambah Variable Ketiga - NEXTAUTH_SECRET:**
   - Click **"Add New"**
   - **Key:** `NEXTAUTH_SECRET`
   - **Value:** `WT+kD2r2WHWKVeMFCUFUxejvx+5rfl7WZ4V2PQUloqY=`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
   - Click **"Save"**

---

## 🔄 Setelah Menambahkan Variables

### Redeploy Project:

1. **Klik tab "Deployments"** di Vercel dashboard
2. **Pilih deployment terbaru** (yang paling atas)
3. **Klik tombol "⋯" (3 dots)** di kanan
4. **Pilih "Redeploy"**
5. **Centang "Use existing Build Cache"** (optional - untuk lebih cepat)
6. **Click "Redeploy"**

Tunggu 2-3 menit sampai deployment selesai.

---

## ✅ Verifikasi Setelah Deploy

### Test endpoints ini:

1. **Homepage:**
   ```
   https://kunam.vercel.app
   ```
   Seharusnya: ✅ Load normal

2. **Session API:**
   ```
   https://kunam.vercel.app/api/auth/session
   ```
   Seharusnya: ✅ Return `{}`

3. **Login Page:**
   ```
   https://kunam.vercel.app/admin/login
   ```
   Seharusnya: ✅ Load form login

4. **Test Login:**
   - Masukkan email & password admin Anda
   - Click login
   - Seharusnya: ✅ Redirect ke dashboard tanpa error

---

## 🎯 Quick Copy-Paste Format

**Jika mau cepat, copy ini satu per satu:**

```
Variable 1:
Key: DATABASE_URL
Value: postgresql://postgres:indrarakayoga@db.qwqnxasybubbyjqexjde.supabase.co:5432/postgres
Env: All

Variable 2:
Key: NEXTAUTH_URL
Value: https://kunam.vercel.app
Env: Production only

Variable 3:
Key: NEXTAUTH_SECRET
Value: WT+kD2r2WHWKVeMFCUFUxejvx+5rfl7WZ4V2PQUloqY=
Env: All
```

---

## 📸 Visual Guide

```
┌─────────────────────────────────────────┐
│ Vercel Dashboard > Settings             │
│ > Environment Variables                 │
├─────────────────────────────────────────┤
│                                         │
│ [Add New] ← Click ini                   │
│                                         │
│ Key: DATABASE_URL                       │
│ Value: postgresql://postgres:...        │
│                                         │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
│                                         │
│ [Save] ← Click ini                      │
└─────────────────────────────────────────┘
```

---

## ⚠️ PENTING!

1. **Jangan lupa REDEPLOY** setelah add env vars
2. **Centang environment yang benar** (Production untuk NEXTAUTH_URL production)
3. **Copy-paste exact** - jangan ada spasi atau enter tambahan
4. **Tunggu deployment selesai** sebelum test

---

## 🐛 Jika Masih Error

1. **Check function logs:**
   - Vercel Dashboard > Deployments
   - Click deployment terbaru
   - Scroll ke "Function Logs"
   - Lihat error message

2. **Verify env vars saved:**
   - Go to Settings > Environment Variables
   - Pastikan 3 variables ada
   - Check value-nya benar

3. **Redeploy again:**
   - Kadang perlu redeploy 2x
   - Clear cache jika perlu

---

Setelah selesai setup, **beri tahu saya hasilnya!** 🚀

Apakah login berhasil atau masih ada error?
