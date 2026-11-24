# Panduan Setup Supabase & Deploy Vercel — SpaceHub FEB UNNES

Panduan singkat (±3 menit) untuk mengaktifkan database **Supabase** lintas perangkat dan men-deploy website ke **Vercel (Free Tier)**.

---

## 1. Setup Database di Supabase

1. Buka [https://supabase.com](https://supabase.com) → **Start your project** → buat project baru (misal `spacehub-feb-unnes`, pilih region **Southeast Asia (Singapore)** agar cepat dari Indonesia).
2. Setelah project siap, buka menu **SQL Editor** di sidebar kiri:
   - Klik **New query**, salin seluruh isi file `supabase/schema.sql`, lalu klik **Run**.
   - Klik **New query** lagi, salin seluruh isi file `supabase/seed.sql`, lalu klik **Run** (mengisi **64 ruangan** FEB UNNES + 1 akun demo `mahasiswa@student.unnes.ac.id` / `contoh123`).
3. Ambil kredensial API di menu **Project Settings → API**:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key** (`eyJhbGci...`)

> **Catatan Keamanan:** Skema sudah mengaktifkan **RLS ketat**, menutup total akses langsung `anon` ke tabel `app_users`, dan seluruh aksi tulis (`auth_unnes_user`, `create_booking_safe`, `cancel_booking_safe`, `report_room_used_safe`, `toggle_favorite_safe`) berjalan melalui `SECURITY DEFINER` RPC dengan penguncian anti-bentrok.

---

## 2. Jalankan di Lokal

1. Salin `.env.example` menjadi `.env` di root project, lalu isi:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
   ```
2. Jalankan perintah berikut:
   ```bash
   npm install
   npm run dev
   ```
3. Buka `http://localhost:5173`.
   *(Jika `.env` belum diisi, aplikasi otomatis berjalan dalam **Mode Demo Lokal** menggunakan `localStorage` dengan banner info di atas agar tetap bisa dipreview.)*

---

## 3. Update Data Ruangan & Tarif dari Klien

Begitu klien mengirim daftar final ruangan, fasilitas, foto, atau tarif:
- Buka **Supabase Dashboard → Table Editor → `rooms`** untuk mengedit langsung (tanpa perlu deploy ulang website), **atau**
- Edit file `supabase/seed.sql` lalu jalankan ulang di **SQL Editor** (`ON CONFLICT (code) DO UPDATE` akan otomatis memperbarui data lama).

---

## 4. Deploy ke Vercel (Subdomain Gratis `.vercel.app`)

1. Push project ke repository GitHub (folder `Client/docx/`, `skills/`, dan `.env` sudah otomatis diabaikan oleh `.gitignore`).
2. Buka [https://vercel.com](https://vercel.com) → **Add New Project** → import repository GitHub tersebut.
3. Framework Preset otomatis terdeteksi sebagai **Vite** (`Build Command: npm run build`, `Output Directory: dist`).
4. Buka bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**. Setelah selesai, website langsung live di `https://<nama-project>.vercel.app`.

---

## 5. Akun Demo & Akses Pengelola

- **Akun Demo Mahasiswa:** `mahasiswa@student.unnes.ac.id` / Password: `contoh123` (atau daftar akun baru dengan email `@student.unnes.ac.id` / `@mail.unnes.ac.id` / `@unnes.ac.id`).
- **PIN Halaman Pengelola / Admin Ringkas:** `feb2026`
