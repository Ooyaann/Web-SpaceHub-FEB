-- ============================================================================
-- SpaceHub FEB UNNES — Seed Master Data 64 Ruangan + Akun Demo UNNES
-- Jalankan setelah supabase/schema.sql pada Supabase SQL Editor.
-- Idempoten (aman dijalankan ulang dengan ON CONFLICT DO UPDATE).
-- ============================================================================

SET search_path TO public, extensions;

-- 1. Seed akun demo default agar presentasi langsung bisa login
INSERT INTO public.app_users (email, full_name, nim, password_hash)
VALUES (
  'mahasiswa@student.unnes.ac.id',
  'Mahasiswa FEB',
  '7101422001',
  crypt('contoh123', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;

-- 2. Seed 64 ruangan FEB UNNES persis sesuai prototype terbaru (Gedung L2, L4, L5)
--    Tarif & deskripsi dapat diedit langsung di Table Editor -> rooms begitu data final klien diterima.
INSERT INTO public.rooms (code, building, floor, location_label, capacity, facilities, price_per_hour, price_note, description, image_url)
VALUES
  -- ==================== GEDUNG L2 · LANTAI 3 (8 Ruang) ====================
  ('L2 301', 'L2', 3, 'Gedung L2 · Lantai 3', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah reguler Gedung L2 lantai 3 dengan pencahayaan baik, nyaman untuk diskusi kelompok maupun kuliah pengganti.', '/images/feb-hero.jpg'),
  ('L2 302', 'L2', 3, 'Gedung L2 · Lantai 3', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas berkapasitas besar di Gedung L2 lantai 3, ideal untuk rapat organisasi, asistensi, atau kelas gabungan.', '/images/room-1.jpg'),
  ('L2 303', 'L2', 3, 'Gedung L2 · Lantai 3', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah ber-AC dengan stopkontak memadai di sisi dinding, cocok untuk kerja kelompok berbasis laptop.', '/images/room-2.jpg'),
  ('L2 304', 'L2', 3, 'Gedung L2 · Lantai 3', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas dilengkapi proyektor dan konektivitas WiFi kampus, siap pakai untuk presentasi tugas dan seminar kecil.', '/images/login-bg.jpg'),
  ('L2 305', 'L2', 3, 'Gedung L2 · Lantai 3', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas tenang di sayap tengah Gedung L2 lantai 3, cocok untuk diskusi tim atau belajar bersama.', '/images/feb-hero.jpg'),
  ('L2 306', 'L2', 3, 'Gedung L2 · Lantai 3', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas kapasitas 50 orang lengkap dengan proyektor permanen dan akses colokan listrik.', '/images/room-1.jpg'),
  ('L2 311', 'L2', 3, 'Gedung L2 · Lantai 3', 60, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kuliah besar di ujung koridor Gedung L2 lantai 3 dengan papan tulis lebar dan proyektor.', '/images/room-2.jpg'),
  ('L2 312', 'L2', 3, 'Gedung L2 · Lantai 3', 40, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas standar di Gedung L2 lantai 3, dekat tangga akses dan mendukung kegiatan diskusi mahasiswa.', '/images/login-bg.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 2 (8 Ruang) ====================
  ('L4 201', 'L4', 2, 'Gedung L4 · Lantai 2', 36, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah Gedung L4 lantai 2 berdekatan dengan lobi utama, mudah diakses dan dilengkapi proyektor.', '/images/feb-hero.jpg'),
  ('L4 202', 'L4', 2, 'Gedung L4 · Lantai 2', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas modern kapasitas 50 kursi di Gedung L4 lantai 2 dengan AC dan whiteboard penuh.', '/images/room-1.jpg'),
  ('L4 203', 'L4', 2, 'Gedung L4 · Lantai 2', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas besar lantai 2 Gedung L4 cocok untuk pembekalan organisasi atau tutorial kelas besar.', '/images/room-2.jpg'),
  ('L4 204', 'L4', 2, 'Gedung L4 · Lantai 2', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah nyaman dengan fasilitas lengkap untuk diskusi intensif maupun bimbingan kelompok.', '/images/login-bg.jpg'),
  ('L4 211', 'L4', 2, 'Gedung L4 · Lantai 2', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas lantai 2 sisi timur Gedung L4, dilengkapi proyektor LCD dan jaringan WiFi UNNES.', '/images/feb-hero.jpg'),
  ('L4 212', 'L4', 2, 'Gedung L4 · Lantai 2', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas ukuran ringkas ber-AC di lantai 2 Gedung L4, ideal untuk rapat panitia atau studi kasus.', '/images/room-1.jpg'),
  ('L4 214', 'L4', 2, 'Gedung L4 · Lantai 2', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah 50 kursi dengan tata letak rapi, mendukung presentasi multimedia dan diskusi.', '/images/room-2.jpg'),
  ('L4 215', 'L4', 2, 'Gedung L4 · Lantai 2', 60, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kuliah kapasitas besar di Gedung L4 lantai 2 dengan pandangan luas ke layar proyektor.', '/images/login-bg.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 3 (3 Ruang) ====================
  ('L4 302', 'L4', 3, 'Gedung L4 · Lantai 3', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah Gedung L4 lantai 3 dengan sirkulasi dingin dan fasilitas presentasi lengkap.', '/images/feb-hero.jpg'),
  ('L4 303', 'L4', 3, 'Gedung L4 · Lantai 3', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas berkapasitas 60 peserta di Gedung L4 lantai 3, ideal untuk rapat pleno atau kelas gabungan.', '/images/room-1.jpg'),
  ('L4 304', 'L4', 3, 'Gedung L4 · Lantai 3', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang diskusi & kuliah ber-AC dengan akses WiFi stabil dan colokan listrik merata.', '/images/room-2.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 4 (5 Ruang) ====================
  ('L4 402', 'L4', 4, 'Gedung L4 · Lantai 4', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kuliah besar lantai 4 Gedung L4, cocok untuk kegiatan himpunan maupun kelas paralel.', '/images/login-bg.jpg'),
  ('L4 403', 'L4', 4, 'Gedung L4 · Lantai 4', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas ber-AC dengan papan tulis lebar dan stopkontak untuk sesi praktikum mandiri laptop.', '/images/feb-hero.jpg'),
  ('L4 410', 'L4', 4, 'Gedung L4 · Lantai 4', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas multimedia lantai 4 lengkap dengan proyektor, WiFi, dan pendingin ruangan.', '/images/room-1.jpg'),
  ('L4 413', 'L4', 4, 'Gedung L4 · Lantai 4', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah kapasitas 36 orang di lantai 4 Gedung L4, tenang dan cocok untuk persiapan sidang/lomba.', '/images/room-2.jpg'),
  ('L4 414', 'L4', 4, 'Gedung L4 · Lantai 4', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas 50 kursi di lantai 4 dengan proyektor gantung dan pencahayaan optimal.', '/images/login-bg.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 5 (8 Ruang termasuk 2 Lab) ====================
  ('L4 503', 'L4', 5, 'Gedung L4 · Lantai 5', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah lantai 5 Gedung L4 ber-AC dengan whiteboard dan colokan listrik.', '/images/feb-hero.jpg'),
  ('L4 504', 'L4', 5, 'Gedung L4 · Lantai 5', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah siap presentasi di lantai 5 Gedung L4 dengan proyektor dan WiFi cepat.', '/images/room-1.jpg'),
  ('L4 511', 'L4', 5, 'Gedung L4 · Lantai 5', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas 36 kursi di lantai 5 Gedung L4, cocok untuk mentoring atau diskusi kelompok kecil.', '/images/room-2.jpg'),
  ('L4 512', 'L4', 5, 'Gedung L4 · Lantai 5', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas favorit di lantai 5 Gedung L4 dengan tata suara jelas dan proyektor HD.', '/images/login-bg.jpg'),
  ('L4 513', 'L4', 5, 'Gedung L4 · Lantai 5', 60, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas berkapasitas besar di lantai 5 Gedung L4, dilengkapi proyektor & papan tulis ganda.', '/images/feb-hero.jpg'),
  ('L4 514', 'L4', 5, 'Gedung L4 · Lantai 5', 40, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah reguler lantai 5 Gedung L4 dengan ventilasi baik dan akses WiFi kampus.', '/images/room-1.jpg'),
  ('L4 Lab 5A', 'L4', 5, 'Gedung L4 · Lantai 5', 30, ARRAY['AC','Proyektor','WiFi','Colokan'], 50000, 'Gratis untuk praktikum mata kuliah · Rp 50.000/jam untuk pelatihan/kegiatan non-akademik', 'Laboratorium komputer & praktikum FEB lantai 5A lengkap dengan meja workstation, proyektor, AC, dan kelistrikan penuh.', '/images/room-2.jpg'),
  ('L4 Lab 5B', 'L4', 5, 'Gedung L4 · Lantai 5', 30, ARRAY['AC','Proyektor','WiFi','Colokan'], 50000, 'Gratis untuk praktikum mata kuliah · Rp 50.000/jam untuk pelatihan/kegiatan non-akademik', 'Laboratorium komputer & olah data FEB lantai 5B dengan AC, proyektor presentasi, WiFi kencang, dan colokan di tiap meja.', '/images/login-bg.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 6 (7 Ruang termasuk 1 Lab) ====================
  ('L4 601', 'L4', 6, 'Gedung L4 · Lantai 6', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas lantai 6 Gedung L4 dengan proyektor, WiFi stabil, dan pemandangan kampus.', '/images/feb-hero.jpg'),
  ('L4 602', 'L4', 6, 'Gedung L4 · Lantai 6', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas 36 kursi di lantai 6 Gedung L4 yang kondusif untuk belajar kelompok dan asistensi.', '/images/room-1.jpg'),
  ('L4 603', 'L4', 6, 'Gedung L4 · Lantai 6', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah kapasitas 50 peserta dengan proyektor dan soket listrik di sepanjang dinding.', '/images/room-2.jpg'),
  ('L4 604', 'L4', 6, 'Gedung L4 · Lantai 6', 60, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas besar lantai 6 Gedung L4 untuk kuliah umum mini, seminar prodi, atau diskusi panel.', '/images/login-bg.jpg'),
  ('L4 611', 'L4', 6, 'Gedung L4 · Lantai 6', 40, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas standar lantai 6 Gedung L4 dengan papan tulis lebar dan jangkauan WiFi kampus.', '/images/feb-hero.jpg'),
  ('L4 612', 'L4', 6, 'Gedung L4 · Lantai 6', 45, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah ber-AC lantai 6 dengan colokan daya memadai untuk sesi kerja tim.', '/images/room-1.jpg'),
  ('L4 Lab 6B', 'L4', 6, 'Gedung L4 · Lantai 6', 30, ARRAY['AC','Proyektor','WiFi','Colokan'], 50000, 'Gratis untuk praktikum mata kuliah · Rp 50.000/jam untuk pelatihan/kegiatan non-akademik', 'Laboratorium praktikum FEB lantai 6B khusus workshop statistik, akuntansi digital, dan simulasi bisnis.', '/images/room-2.jpg'),

  -- ==================== GEDUNG L4 · LANTAI 7 (10 Ruang) ====================
  ('L4 701', 'L4', 7, 'Gedung L4 · Lantai 7', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah lantai 7 Gedung L4 suasana tenang, nyaman untuk diskusi dan bimbingan skripsi.', '/images/login-bg.jpg'),
  ('L4 702', 'L4', 7, 'Gedung L4 · Lantai 7', 50, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas 50 kursi lantai 7 Gedung L4 dengan proyektor dan fasilitas AC.', '/images/feb-hero.jpg'),
  ('L4 703', 'L4', 7, 'Gedung L4 · Lantai 7', 60, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kuliah besar lantai 7 Gedung L4, cocok untuk rapat kerja organisasi dan kelas gabungan.', '/images/room-1.jpg'),
  ('L4 704', 'L4', 7, 'Gedung L4 · Lantai 7', 40, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas reguler di lantai 7 Gedung L4 dengan papan tulis dan sinyal WiFi baik.', '/images/room-2.jpg'),
  ('L4 711', 'L4', 7, 'Gedung L4 · Lantai 7', 45, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas ber-AC lantai 7 dilengkapi whiteboard dan banyak titik colokan listrik.', '/images/login-bg.jpg'),
  ('L4 712', 'L4', 7, 'Gedung L4 · Lantai 7', 36, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah ringkas dengan proyektor dan WiFi cepat, cocok untuk latihan presentasi lomba.', '/images/feb-hero.jpg'),
  ('L4 713', 'L4', 7, 'Gedung L4 · Lantai 7', 50, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah 50 orang lantai 7 Gedung L4 ber-AC dengan tata kursi fleksibel.', '/images/room-1.jpg'),
  ('L4 714', 'L4', 7, 'Gedung L4 · Lantai 7', 60, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas besar lantai 7 dengan proyektor dan daya listrik siap pakai untuk seminar kelas.', '/images/room-2.jpg'),
  ('L4 715', 'L4', 7, 'Gedung L4 · Lantai 7', 40, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas 40 kursi lantai 7 Gedung L4 dengan AC, proyektor, dan whiteboard.', '/images/login-bg.jpg'),
  ('L4 716', 'L4', 7, 'Gedung L4 · Lantai 7', 45, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas ujung koridor lantai 7 Gedung L4 yang tenang untuk diskusi kelompok.', '/images/feb-hero.jpg'),

  -- ==================== GEDUNG L5 · LANTAI 1 (5 Ruang) ====================
  ('L5 101', 'L5', 1, 'Gedung L5 · Lantai 1', 45, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas lantai dasar Gedung L5 yang mudah diakses tanpa tangga, dilengkapi AC dan WiFi.', '/images/room-1.jpg'),
  ('L5 102', 'L5', 1, 'Gedung L5 · Lantai 1', 36, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah lantai 1 Gedung L5 siap presentasi dengan proyektor dan stopkontak.', '/images/room-2.jpg'),
  ('L5 103', 'L5', 1, 'Gedung L5 · Lantai 1', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah kapasitas 50 peserta lantai 1 Gedung L5 dengan AC, proyektor, dan whiteboard.', '/images/login-bg.jpg'),
  ('L5 107', 'L5', 1, 'Gedung L5 · Lantai 1', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas besar lantai dasar Gedung L5 ideal untuk kegiatan kemahasiswaan dan kelas paralel.', '/images/feb-hero.jpg'),
  ('L5 108', 'L5', 1, 'Gedung L5 · Lantai 1', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas ber-AC lantai 1 Gedung L5 dengan fasilitas WiFi, whiteboard, dan colokan lengkap.', '/images/room-1.jpg'),

  -- ==================== GEDUNG L5 · LANTAI 2 (5 Ruang) ====================
  ('L5 201', 'L5', 2, 'Gedung L5 · Lantai 2', 36, ARRAY['AC','Proyektor','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah lantai 2 Gedung L5 berkapasitas 36 orang lengkap dengan proyektor.', '/images/room-2.jpg'),
  ('L5 202', 'L5', 2, 'Gedung L5 · Lantai 2', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah 50 kursi lantai 2 Gedung L5 nyaman untuk kuliah pengganti dan presentasi.', '/images/login-bg.jpg'),
  ('L5 203', 'L5', 2, 'Gedung L5 · Lantai 2', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kelas besar lantai 2 Gedung L5 dengan papan tulis luas dan konektivitas WiFi.', '/images/feb-hero.jpg'),
  ('L5 207', 'L5', 2, 'Gedung L5 · Lantai 2', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang diskusi ber-AC lantai 2 Gedung L5 dengan akses colokan listrik untuk seluruh tim.', '/images/room-1.jpg'),
  ('L5 208', 'L5', 2, 'Gedung L5 · Lantai 2', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas multimedia lantai 2 Gedung L5 ber-AC, proyektor, WiFi, dan colokan.', '/images/room-2.jpg'),

  -- ==================== GEDUNG L5 · LANTAI 3 (5 Ruang) ====================
  ('L5 301', 'L5', 3, 'Gedung L5 · Lantai 3', 50, ARRAY['AC','Proyektor','Whiteboard'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah 50 peserta di lantai 3 Gedung L5 lengkap dengan proyektor dan whiteboard.', '/images/login-bg.jpg'),
  ('L5 302', 'L5', 3, 'Gedung L5 · Lantai 3', 60, ARRAY['Whiteboard','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 75.000/jam', 'Ruang kuliah besar lantai 3 Gedung L5 untuk kelas tambahan, asistensi, atau forum mahasiswa.', '/images/feb-hero.jpg'),
  ('L5 303', 'L5', 3, 'Gedung L5 · Lantai 3', 40, ARRAY['AC','Whiteboard','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah ber-AC lantai 3 Gedung L5 dengan papan tulis, WiFi, dan colokan memadai.', '/images/room-1.jpg'),
  ('L5 307', 'L5', 3, 'Gedung L5 · Lantai 3', 45, ARRAY['AC','Proyektor','WiFi','Colokan'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kelas lantai 3 Gedung L5 siap pakai untuk presentasi kelompok dengan proyektor dan WiFi.', '/images/room-2.jpg'),
  ('L5 308', 'L5', 3, 'Gedung L5 · Lantai 3', 36, ARRAY['AC','WiFi'], 0, 'Gratis untuk kegiatan akademik mahasiswa FEB · Tarif umum Rp 50.000/jam', 'Ruang kuliah tenang di lantai 3 Gedung L5, nyaman untuk rapat kecil dan diskusi riset.', '/images/login-bg.jpg')
ON CONFLICT (code) DO UPDATE SET
  building = EXCLUDED.building,
  floor = EXCLUDED.floor,
  location_label = EXCLUDED.location_label,
  capacity = EXCLUDED.capacity,
  facilities = EXCLUDED.facilities,
  price_per_hour = EXCLUDED.price_per_hour,
  price_note = EXCLUDED.price_note,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;
