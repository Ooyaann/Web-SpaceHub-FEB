# 001 — Initial Build SpaceHub FEB UNNES

- **Tanggal:** 24 November 2026
- **Status:** Selesai (Build & Verifikasi Otomatis Lulus)
- **Target Repo:** `https://github.com/Ooyaann/Web-SpaceHub-FEB.git`

## Ringkasan Pencapaian
1. **Struktur & Tech Stack:** Migrasi dari prototype HTML tunggal menjadi SPA modular **React 18 + Vite + Tailwind CSS + Lucide React** dengan ekstraksi 4 foto ruangan ke `public/images/`.
2. **Database & Keamanan Supabase (`supabase/schema.sql` & `supabase/seed.sql`):**
   - Mengaktifkan `pgcrypto`, RLS ketat (tabel `app_users` ditutup total dari `anon`/`authenticated`), serta 5 RPC `SECURITY DEFINER` (`SET search_path = public, extensions`) dengan `pg_advisory_xact_lock` anti double-booking.
   - Seed 64 ruangan FEB UNNES (`L2`: 8, `L4`: 41 termasuk Lab 5A/5B/6B, `L5`: 15) + tarif default & akun demo.
3. **Fitur Utama (P0 & P1):**
   - **P0:** Login/Daftar email UNNES, Cari Ruang (+chip `Whiteboard` & badge tarif), Detail Ruang Lengkap (+kartu tarif, deskripsi, timeline, rekomendasi alternatif, lapor terpakai), Booking (+guard slot `"Ada kelas"`), Booking Saya (+batal), dan Halaman Pengelola Ringkas (PIN `feb2026`).
   - **P1:** Denah Lantai, Jadwal Semua Ruang, Kalender 31 Hari, Favorit, Riwayat Notifikasi In-App, Alur Sistem, dan Toggle Light/Dark Mode.
4. **Verifikasi:** `npm run build` lulus tanpa error dan 8/8 suite verifikasi otomatis (aturan WIB, validasi email/NIM, pemblokiran slot `"Ada kelas"`, batas kuota/pembatalan, 64 ruang, & invariant keamanan SQL) lulus.

## Masukan Baru untuk Iterasi Berikutnya (`002`) — *Menunggu Konfirmasi Eksekusi*
- **Upgrade Desain & UX:** Jangan terlalu plek ketiplek dengan prototype; tingkatkan kualitas visual & interaksi ke level web app modern/profesional.
- **Date Picker Kalender Popup:** Ganti dropdown tanggal teks (`Hari ini`, `Besok`, dst.) menjadi **popup kalender interaktif** (dengan shortcut cepat `Hari ini` / `Besok` di dalamnya).
- **Copywriting Ringkas:** Pangkas teks panjang/bertele-tele di seluruh kartu, banner, deskripsi, dan panduan agar antarmuka lebih bersih, lega, dan mudah dipindai (*scannable*).
