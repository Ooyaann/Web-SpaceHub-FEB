# 002 — UI/UX Overhaul, Kalender Date Picker Popup & Copywriting Ringkas

- **Tanggal:** 24 November 2026
- **Status:** Selesai (Build & Verifikasi Otomatis Lulus)
- **Berdasarkan Masukan:**
  1. Tampilan & interaksi ditingkatkan agar lebih modern/profesional dan tidak terlalu plek ketiplek dengan prototype.
  2. Pemilih tanggal diganti dari dropdown teks (`Hari ini / Besok`) menjadi **popup kalender bulan interaktif**.
  3. Teks/copywriting dipangkas agar singkat, lega, dan mudah dipindai (*scannable*).

## Perubahan yang Diimplementasikan
1. **Komponen Baru `DatePickerPopover` (`src/components/DatePickerPopover.jsx`):**
   - Popup kalender bulan interaktif (`Sen–Min`) dengan navigasi bulan, penanda hari ini, nonaktif otomatis untuk tanggal lewat & >30 hari, serta tombol shortcut cepat `Hari ini` · `Besok` · `Lusa`.
   - Diterapkan seragam di seluruh halaman (`Cari Ruang`, `Detail Ruang`, `Booking`, `Denah Lantai`, `Jadwal Ruang`, `Favorit`, dan `Pengelola`).
2. **Interaksi Slot Modern:**
   - **Klik Langsung Slot Jam (`HourBar`):** Kotak slot kosong di `Detail Ruang` dan `Jadwal Ruang` kini bisa langsung diklik untuk masuk ke form booking dengan tanggal & jam terpilih otomatis.
   - **Grid Slot Jam & Segmented Durasi di `BookingView` & `FindView`:** Mengganti dropdown jam/durasi yang kaku menjadi tombol slot visual (slot terisi/kuliah tampak nonaktif & dicoret) dan tombol segmen `1j / 2j / 3j`.
3. **Elevasi Visual & Fungsionalitas:**
   - **Kartu Ruang Vertikal 3 Kolom (`RoomCard`):** Foto rasio 16:10, badge status di pojok gambar, tombol favorit *glassmorphic*, badge tarif, kapasitas, dan chip fasilitas ringkas.
   - **Sidebar Terkelompok:** Navigasi dikelompokkan (`Eksplorasi`, `Aktivitas`, `Lainnya`) dengan desain terang/gelap yang lebih bersih.
   - **Filter Tarif (`Semua Tarif` / `Gratis FEB` / `Lab`)** di halaman `Cari Ruang`.
   - **E-Ticket Booking (`MyBookingsView`):** Kartu booking bergaya tiket dengan aksen warna status dan tombol **Salin Kode Booking (`SH-XXXXX`)** 1-klik.
   - **Pencarian Riwayat di `AdminView`:** Search berdasarkan kode booking, NIM, nama, atau kode ruang, serta ringkasan keterisian 3 kolom per gedung.
   - **Badge Rasio `Kosong/Total`** di tab tiap lantai pada `Denah Lantai`.
4. **Copywriting Ringkas:**
   - Aturan booking panjang diubah menjadi 4 mini-pill (`BookingRulesPills`).
   - Deskripsi ruang, subtitle halaman, banner, dan `Panduan Singkat` (6 kartu ikon) dipangkas menjadi frasa padat 1 baris.
