# 003 — Audit Visual, Sistem Warna Baru, Custom SelectPopover, Role Login & Rombak 4 Halaman Eksplorasi

- **Tanggal:** 24 November 2026
- **Status:** Selesai (Build & Verifikasi Otomatis Lulus)
- **Berdasarkan Audit & Masukan:**
  1. Dropdown native `<select>` tidak seragam dan terlihat kaku.
  2. Warna sebelumnya terlalu ramai (kuning terlalu dominan + dark mode biru navy pekat).
  3. Menu `Pengelola` tidak semestinya tampil di akun mahasiswa.
  4. Empat halaman eksplorasi (`Cari Ruang`, `Denah Lantai`, `Jadwal Ruang`, `Kalender`) terasa terlalu padat dan fungsinya kurang langsung terbaca.

## Perubahan Utama
1. **Sistem Warna "Restrained Modern Campus" (`tailwind.config.js` & `src/index.css`):**
   - Light Mode: Neutral Slate (`#f8fafc` canvas, `#ffffff` card, `#e2e8f0` border).
   - Dark Mode: Deep Neutral Charcoal-Slate (`#090d16` canvas, `#111827` card, `#1f2a40` border) — jauh lebih adem di mata.
   - Brand Primer: Deep Navy (`#1e3a8a` light / `#3b82f6` dark); Emerald lembut untuk status **Kosong**; Gold (`#eab308`) dihemat khusus aksen logo & bintang favorit.
2. **Custom `SelectPopover` (`src/components/SelectPopover.jsx`):**
   - Menggantikan 100% `<select>` native di seluruh aplikasi dengan kontrol seragam tinggi (`h-10`), radius (`rounded-xl`), ikon Lucide, dan menu pop-up ber-checkmark.
3. **Pemisahan Peran di Login (`LoginView.jsx`, `Sidebar.jsx`, `MobileNav.jsx`):**
   - Switch **`Mahasiswa`** | **`Pengelola`** langsung di halaman Login (Pengelola memakai PIN `feb2026`).
   - Akun Mahasiswa hanya melihat menu klien (`Cari Ruang`, `Denah Lantai`, `Jadwal Ruang`, `Kalender`, `Booking Saya`, `Favorit`, `Notifikasi`, `Alur Sistem`) tanpa menu `Pengelola`.
4. **Rombak 4 Halaman Eksplorasi:**
   - **`Cari Ruang` (`FindView.jsx`):** Header bersih tanpa hero banner besar; toolbar 2 baris simetris (Baris 1: Tanggal, Jam, Durasi, Search; Baris 2: Gedung, Kapasitas, Tarif, Urutkan, tombol Fasilitas lipat) — menghilangkan dropdown menggantung di baris ke-3.
   - **`Denah Lantai` (`FloorPlanView.jsx`):** Selector 2 tingkat (Gedung `L2/L4/L5` → Lantai dengan rasio `kosong/total`), ringkasan jumlah status, serta denah visual dengan Sisi Utara/Selatan, Koridor, akses tangga, badge `LAB`, dan 4 warna status jelas.
   - **`Jadwal Ruang` (`ScheduleView.jsx`):** Fokus 1 gedung per tampilan (`L2 / L4 / L5`) + filter Lantai + toggle **`Ada slot kosong saja`** + timeline lega dengan warna pastel lembut (tidak lagi memuntahkan 640 kotak sekaligus).
   - **`Kalender` (`CalendarView.jsx`):** Split 2 kolom — Kalender bulanan lega dengan 1 indikator bar ketersediaan di kiri, dan Panel Ringkasan bertab (`Kosong` / `Dibooking` / `Ada Kelas`) + tombol aksi **`Cari Ruang di Tanggal Ini →`** di kanan.
