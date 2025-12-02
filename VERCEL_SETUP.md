# 🚨 PENTING: Setup Environment Variables di Vercel

## Error yang Anda alami:
❌ `500 (Internal Server Error)` di https://kunam.vercel.app/api/auth/error

## Root Cause:
Environment variables tidak terset dengan benar di Vercel (production).

## ✅ Solusi - Setup di Vercel Dashboard:

### 1. Buka Vercel Dashboard
https://vercel.com/rinnrg/kunam/settings/environment-variables

### 2. Tambahkan Environment Variables berikut:

#### **DATABASE_URL**
```
postgresql://postgres.qwqnxasybubbyjqexjde:indrarakayoga@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Environment: **Production, Preview, Development**

#### **DIRECT_URL**
```
postgresql://postgres:indrarakayoga@db.qwqnxasybubbyjqexjde.supabase.co:5432/postgres
```
- Environment: **Production, Preview, Development**

#### **NEXTAUTH_URL**
```
https://kunam.vercel.app
```
- Environment: **Production**

```
https://kunam-preview.vercel.app
```
- Environment: **Preview** (sesuaikan dengan preview URL Anda)

```
http://localhost:3000
```
- Environment: **Development**

#### **NEXTAUTH_SECRET**
```
WT+kD2r2WHWKVeMFCUFUxejvx+5rfl7WZ4V2PQUloqY=
```
- Environment: **Production, Preview, Development**

### 3. Redeploy

Setelah menambahkan semua environment variables:

1. Klik tab **Deployments**
2. Pilih deployment terbaru
3. Klik **⋯** (3 dots)
4. Pilih **Redeploy**
5. Centang **Use existing Build Cache** (optional)
6. Klik **Redeploy**

---

## 🔧 Langkah-langkah Detail:

### Via Vercel CLI (Alternatif):
```bash
# Login ke Vercel
vercel login

# Set environment variables
vercel env add DATABASE_URL
# Paste value saat diminta

vercel env add DIRECT_URL
# Paste value saat diminta

vercel env add NEXTAUTH_URL
# Paste value saat diminta

vercel env add NEXTAUTH_SECRET
# Paste value saat diminta

# Pull ke local
vercel env pull

# Redeploy
vercel --prod
```

---

## 🧪 Test Setelah Deploy:

1. **Test Session Endpoint:**
   ```
   GET https://kunam.vercel.app/api/auth/session
   ```
   Should return: `{}`

2. **Test Login:**
   - Buka: https://kunam.vercel.app/admin/login
   - Login dengan credentials admin Anda
   - Seharusnya redirect ke dashboard

3. **Test API:**
   ```
   GET https://kunam.vercel.app/api/produk
   ```
   Should return: `[...]` (array produk)

---

## ⚠️ Troubleshooting:

### Jika masih error 500:
1. Check Vercel Function Logs:
   - Vercel Dashboard → Project → Deployments
   - Klik deployment terbaru
   - Scroll ke **Function Logs**
   - Lihat error message detail

2. Check Runtime Logs:
   - Vercel Dashboard → Project → Deployments
   - Tab **Runtime Logs**
   - Filter: Functions
   - Cari error dari `/api/auth/*`

### Jika error "Database connection":
1. Check Supabase dashboard
2. Pastikan database tidak paused
3. Verify connection string
4. Check if IP is whitelisted (Vercel IPs dynamic)

### Jika error "NEXTAUTH_SECRET missing":
- Make sure environment variable ada di Vercel
- Redeploy after adding env vars
- Jangan lupa select **Production** environment

---

## 📝 Quick Checklist:

- [ ] DATABASE_URL added to Vercel
- [ ] DIRECT_URL added to Vercel
- [ ] NEXTAUTH_URL added to Vercel (with correct domain)
- [ ] NEXTAUTH_SECRET added to Vercel
- [ ] All env vars selected for **Production** environment
- [ ] Redeployed project
- [ ] Tested login page
- [ ] Checked function logs for errors

---

## 🎯 Expected Result:

✅ https://kunam.vercel.app → Homepage loads
✅ https://kunam.vercel.app/admin/login → Login page loads
✅ https://kunam.vercel.app/api/auth/session → Returns `{}`
✅ Login works without 500 error
✅ Admin dashboard accessible after login

---

**Setelah setup, beri tahu saya hasilnya!** 🚀
