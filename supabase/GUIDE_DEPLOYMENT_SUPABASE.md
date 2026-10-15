# PANDUAN KONFIGURASI DAN DEPLOYMENT SUPABASE
## Massa Photo Booking Form Management System

Dokumen ini menjelaskan langkah demi langkah untuk menghubungkan aplikasi **Massa Photo Booking System** ke database **Supabase PostgreSQL** dengan **Row Level Security (RLS)** dan **Supabase Auth**.

---

### 1. Buat Proyek Baru di Supabase
1. Kunjungi dashboard [Supabase](https://supabase.com) dan login/daftar akun.
2. Klik tombol **New Project**.
3. Masukkan konfigurasi:
   - **Name:** `Massa Photo Booking`
   - **Database Password:** Buat password yang kuat dan simpan baik-baik.
   - **Region:** Pilih region terdekat (misalnya `Singapore (ap-southeast-1)`).
4. Klik **Create new project** dan tunggu proses inisialisasi (~1-2 menit).

---

### 2. Jalankan SQL Migration
1. Di dashboard Supabase, buka menu **SQL Editor** pada sidebar kiri.
2. Klik **New query**.
3. Buka file di repo ini: `supabase/migrations/20261015000000_massa_photo_init.sql`.
4. Salin seluruh isi query dan tempelkan ke SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl+Enter`).
6. Pastikan pesan sukses muncul: *"Success. No rows returned"*.
7. Sekarang seluruh tabel (`vendor_profiles`, `packages`, `package_terms`, `package_fields`, `package_versions`, `clients`, `booking_forms`, `booking_responses`, `whatsapp_templates`, `booking_activity_logs`) telah terbuat lengkap dengan **Row Level Security (RLS)** dan data awal (Massa Photo, Intimate Wedding Package, Klien Rendi & Nita).

---

### 3. Konfigurasi Autentikasi Admin
1. Buka menu **Authentication** -> **Users** di Supabase.
2. Klik **Add user** -> **Create user**.
3. Masukkan email admin (contoh: `admin@massaphoto.id`) dan password yang aman.
4. Pastikan opsi **Auto Confirm User** dicentang agar tidak memerlukan verifikasi email.
5. Di menu **Authentication** -> **URL Configuration**:
   - Atur **Site URL** ke domain aplikasi Anda (contoh: URL Cloud Run / Vercel / Netlify).

---

### 4. Dapatkan Kredensial API
1. Buka **Project Settings** -> **API**.
2. Salin nilai berikut:
   - **Project URL** (contoh: `https://xyzprojectref.supabase.co`)
   - **anon / public key** (kunci publik yang aman untuk frontend)
   - *(PENTING)* JANGAN berikan `service_role key` ke client browser.

---

### 5. Atur Environment Variables
Di root project aplikasi Anda, buat file `.env` (atau salin dari `.env.example`):
```bash
VITE_SUPABASE_URL="https://xyzprojectref.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Aplikasi juga menyediakan **Modal Pengaturan Supabase** langsung di dashboard admin, sehingga Anda dapat memasukkan atau mengganti URL & Anon Key tanpa harus rebuild aplikasi!

---

### 6. Arsitektur Keamanan RLS (Row Level Security)
- **Admin**: Autentikasi menggunakan Supabase Auth JWT. Admin yang terotentikasi memiliki akses penuh CRUD ke seluruh data vendor, paket, klien, dan form.
- **Klien Publik**: Mengakses formulir menggunakan token acak kriptografis (`public_token`).
  - Publik hanya dapat membaca data form miliknya sendiri jika token cocok dan masa berlaku belum habis.
  - Submit formulir hanya mengizinkan pengisian jawaban dan perubahan status ke `submitted` jika `terms_agreed = true`.
  - Formulir yang sudah disubmit atau dibatalkan dikunci (*read-only*) untuk mencegah manipulasi ulang data.

---

### 7. Deployment Aplikasi Frontend
Build aplikasi untuk produksi:
```bash
npm run build
```
Folder `dist/` siap dideploy ke platform hosting mana pun (Google Cloud Run, Vercel, Netlify, Cloudflare Pages, atau Docker).
