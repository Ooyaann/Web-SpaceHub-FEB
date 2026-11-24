-- ============================================================================
-- SpaceHub FEB UNNES — Skema Database, RLS Ketat, & SECURITY DEFINER RPC
-- Jalankan seluruh script ini di Supabase SQL Editor (Project -> SQL Editor)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABEL MASTER RUANGAN (rooms)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  building text NOT NULL,
  floor int NOT NULL,
  location_label text NOT NULL,
  capacity int NOT NULL CHECK (capacity > 0),
  facilities text[] NOT NULL DEFAULT '{}',
  price_per_hour int NOT NULL DEFAULT 0 CHECK (price_per_hour >= 0),
  price_note text NOT NULL DEFAULT 'Gratis untuk kegiatan akademik mahasiswa FEB UNNES',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_building_floor ON public.rooms (building, floor);

-- ----------------------------------------------------------------------------
-- 2. TABEL PENGGUNA RINGAN EMAIL UNNES (app_users)
--    Catatan keamanan: Akses langsung untuk anon/authenticated DITUTUP TOTAL.
--    Semua login & registrasi wajib melalui RPC auth_unnes_user (SECURITY DEFINER).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_users (
  email text PRIMARY KEY CHECK (email ~* '^[^@\s]+@(student\.|mail\.)?unnes\.ac\.id$'),
  full_name text NOT NULL,
  nim text,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABEL BOOKING RUANG (bookings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  room_code text NOT NULL REFERENCES public.rooms(code) ON UPDATE CASCADE ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_hour int NOT NULL CHECK (start_hour BETWEEN 7 AND 16),
  duration int NOT NULL CHECK (duration BETWEEN 1 AND 3),
  user_email text NOT NULL,
  user_name text NOT NULL,
  nim text NOT NULL CHECK (nim ~ '^\d{8,12}$'),
  purpose text NOT NULL,
  participants int NOT NULL CHECK (participants > 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_end_hour_check CHECK (start_hour + duration <= 17)
);

CREATE INDEX IF NOT EXISTS idx_bookings_room_date_status ON public.bookings (room_code, booking_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON public.bookings (lower(user_email), booking_date);

-- ----------------------------------------------------------------------------
-- 4. TABEL LAPORAN RUANG SEDANG TERPAKAI (room_reports)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(code) ON UPDATE CASCADE ON DELETE CASCADE,
  report_date date NOT NULL,
  report_hour int NOT NULL CHECK (report_hour BETWEEN 7 AND 16),
  reported_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_reports_unique_slot UNIQUE (room_code, report_date, report_hour)
);

CREATE INDEX IF NOT EXISTS idx_room_reports_date ON public.room_reports (report_date, room_code);

-- ----------------------------------------------------------------------------
-- 5. TABEL RUANGAN FAVORIT (user_favorites)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_email text NOT NULL,
  room_code text NOT NULL REFERENCES public.rooms(code) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_email, room_code)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & HAK AKSES KETAT
-- ============================================================================

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_users FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.rooms FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.bookings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.room_reports FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_favorites FROM anon, authenticated;

GRANT SELECT ON TABLE public.rooms TO anon, authenticated;
GRANT SELECT ON TABLE public.bookings TO anon, authenticated;
GRANT SELECT ON TABLE public.room_reports TO anon, authenticated;
GRANT SELECT ON TABLE public.user_favorites TO anon, authenticated;

DROP POLICY IF EXISTS "rooms_select_public" ON public.rooms;
CREATE POLICY "rooms_select_public" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "bookings_select_public" ON public.bookings;
CREATE POLICY "bookings_select_public" ON public.bookings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "room_reports_select_public" ON public.room_reports;
CREATE POLICY "room_reports_select_public" ON public.room_reports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_favorites_select_public" ON public.user_favorites;
CREATE POLICY "user_favorites_select_public" ON public.user_favorites
  FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- FUNGSI RPC SECURITY DEFINER (SET search_path = public, extensions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC 1: auth_unnes_user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_unnes_user(
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL,
  p_mode text DEFAULT 'login'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_full_name, ''));
  v_user public.app_users%ROWTYPE;
BEGIN
  IF v_email !~* '^[^@\s]+@(student\.|mail\.)?unnes\.ac\.id$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Gunakan email UNNES (@student.unnes.ac.id, @mail.unnes.ac.id, atau @unnes.ac.id).');
  END IF;

  IF length(coalesce(p_password, '')) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Password minimal 6 karakter.');
  END IF;

  SELECT * INTO v_user FROM public.app_users WHERE email = v_email;

  IF p_mode = 'register' THEN
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Email UNNES ini sudah terdaftar. Silakan pindah ke tab Masuk.');
    END IF;

    IF v_name = '' THEN
      v_name := initcap(regexp_replace(split_part(v_email, '@', 1), '[^a-zA-Z]+', ' ', 'g'));
    END IF;

    INSERT INTO public.app_users (email, full_name, password_hash)
    VALUES (v_email, v_name, crypt(p_password, gen_salt('bf')))
    RETURNING * INTO v_user;

    RETURN jsonb_build_object(
      'ok', true,
      'user', jsonb_build_object(
        'email', v_user.email,
        'name', v_user.full_name,
        'nim', coalesce(v_user.nim, '')
      )
    );
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Email belum terdaftar. Silakan daftar akun terlebih dahulu di tab Daftar.');
  END IF;

  IF crypt(p_password, v_user.password_hash) <> v_user.password_hash THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Password tidak sesuai. Periksa kembali password Anda.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'email', v_user.email,
      'name', v_user.full_name,
      'nim', coalesce(v_user.nim, '')
    )
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 2: create_booking_safe (Atomik anti-bentrok dengan advisory lock)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_booking_safe(
  p_id text,
  p_room_code text,
  p_booking_date date,
  p_start_hour int,
  p_duration int,
  p_user_email text,
  p_user_name text,
  p_nim text,
  p_purpose text,
  p_participants int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_user_email, '')));
  v_now_wib timestamp := now() AT TIME ZONE 'Asia/Jakarta';
  v_today_wib date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_now_hour_wib int := extract(hour FROM v_now_wib)::int;
  v_room public.rooms%ROWTYPE;
  v_active_count int;
  v_booking public.bookings%ROWTYPE;
  v_booking_id text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE email = v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi pengguna tidak valid. Silakan login ulang.');
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE code = p_room_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan tidak ditemukan.');
  END IF;

  IF p_participants IS NULL OR p_participants < 1 OR p_participants > v_room.capacity THEN
    RETURN jsonb_build_object('ok', false, 'error', format('Jumlah peserta harus antara 1 sampai %s orang.', v_room.capacity));
  END IF;

  IF coalesce(trim(p_nim), '') !~ '^\d{8,12}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NIM harus berupa angka 8 sampai 12 digit.');
  END IF;

  IF coalesce(trim(p_purpose), '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Keperluan booking wajib diisi.');
  END IF;

  IF p_booking_date < v_today_wib OR p_booking_date > (v_today_wib + 30) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Booking hanya tersedia untuk hari ini sampai 30 hari ke depan.');
  END IF;

  IF p_start_hour < 7 OR p_start_hour > 16 OR p_duration < 1 OR p_duration > 3 OR (p_start_hour + p_duration) > 17 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Jam operasional booking adalah 07.00–17.00 dengan durasi 1–3 jam.');
  END IF;

  IF p_booking_date = v_today_wib AND p_start_hour < v_now_hour_wib THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Jam mulai yang dipilih sudah lewat.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_room_code || ':' || p_booking_date::text));

  SELECT COUNT(*) INTO v_active_count
  FROM public.bookings
  WHERE lower(user_email) = v_email
    AND status = 'confirmed'
    AND (
      booking_date > v_today_wib
      OR (booking_date = v_today_wib AND (start_hour + duration) > v_now_hour_wib)
    );

  IF v_active_count >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kuota maksimal 3 booking aktif sudah tercapai. Batalkan salah satu terlebih dahulu.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_code = p_room_code
      AND booking_date = p_booking_date
      AND status = 'confirmed'
      AND start_hour < (p_start_hour + p_duration)
      AND (start_hour + duration) > p_start_hour
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Maaf, jam ini baru saja dibooking pengguna lain. Silakan pilih jam atau ruangan lain.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.room_reports
    WHERE room_code = p_room_code
      AND report_date = p_booking_date
      AND report_hour >= p_start_hour
      AND report_hour < (p_start_hour + p_duration)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan dilaporkan sedang terpakai di lapangan pada jam tersebut.');
  END IF;

  v_booking_id := coalesce(nullif(trim(p_id), ''), 'SH-' || upper(substr(md5(gen_random_uuid()::text), 1, 5)));

  INSERT INTO public.bookings (
    id, room_code, booking_date, start_hour, duration,
    user_email, user_name, nim, purpose, participants, status
  )
  VALUES (
    v_booking_id, p_room_code, p_booking_date, p_start_hour, p_duration,
    v_email, trim(coalesce(p_user_name, 'Mahasiswa')), trim(p_nim), trim(p_purpose), p_participants, 'confirmed'
  )
  RETURNING * INTO v_booking;

  UPDATE public.app_users SET nim = trim(p_nim) WHERE email = v_email;

  RETURN jsonb_build_object('ok', true, 'booking', to_jsonb(v_booking));
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 3: cancel_booking_safe
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_booking_safe(
  p_id text,
  p_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_user_email, '')));
  v_now_wib timestamp := now() AT TIME ZONE 'Asia/Jakarta';
  v_today_wib date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_now_hour_wib int := extract(hour FROM v_now_wib)::int;
  v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_id AND lower(user_email) = v_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Data booking tidak ditemukan atau bukan milik akun ini.');
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Booking ini sudah dibatalkan sebelumnya.');
  END IF;

  IF v_booking.booking_date < v_today_wib
     OR (v_booking.booking_date = v_today_wib AND v_now_hour_wib >= v_booking.start_hour) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Booking yang sudah dimulai atau lewat tidak dapat dibatalkan.');
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'id', p_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 4: report_room_used_safe
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_room_used_safe(
  p_room_code text,
  p_report_date date,
  p_report_hour int,
  p_reported_by text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_reported_by, '')));
BEGIN
  IF v_email <> 'pengelola@unnes.ac.id' AND NOT EXISTS (SELECT 1 FROM public.app_users WHERE email = v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi pengguna tidak valid.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = p_room_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan tidak ditemukan.');
  END IF;

  IF p_report_hour < 7 OR p_report_hour > 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Pelaporan hanya tersedia pada jam operasional 07.00–17.00.');
  END IF;

  INSERT INTO public.room_reports (room_code, report_date, report_hour, reported_by)
  VALUES (p_room_code, p_report_date, p_report_hour, v_email)
  ON CONFLICT (room_code, report_date, report_hour) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 5: toggle_favorite_safe
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_favorite_safe(
  p_user_email text,
  p_room_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_user_email, '')));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE email = v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi pengguna tidak valid.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = p_room_code) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan tidak ditemukan.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_favorites
    WHERE user_email = v_email AND room_code = p_room_code
  ) THEN
    DELETE FROM public.user_favorites
    WHERE user_email = v_email AND room_code = p_room_code;
    RETURN jsonb_build_object('ok', true, 'favorited', false);
  ELSE
    INSERT INTO public.user_favorites (user_email, room_code)
    VALUES (v_email, p_room_code);
    RETURN jsonb_build_object('ok', true, 'favorited', true);
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 6: admin_upsert_room_safe (Pengelola: Tambah / Edit Ruang & Tarif)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_upsert_room_safe(
  p_admin_pin text,
  p_original_code text,
  p_code text,
  p_building text,
  p_floor int,
  p_capacity int,
  p_facilities text[],
  p_price_per_hour int,
  p_price_note text,
  p_description text,
  p_image_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_code text := trim(coalesce(p_code, ''));
  v_building text := upper(trim(coalesce(p_building, 'L4')));
  v_room public.rooms%ROWTYPE;
BEGIN
  IF lower(trim(coalesce(p_admin_pin, ''))) <> 'feb2026' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN Pengelola tidak valid.');
  END IF;

  IF v_code = '' OR p_capacity IS NULL OR p_capacity < 1 OR p_floor IS NULL OR p_floor < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kode ruang, lantai, dan kapasitas wajib diisi dengan benar.');
  END IF;

  IF coalesce(trim(p_original_code), '') <> '' THEN
    UPDATE public.rooms
    SET
      code = v_code,
      building = v_building,
      floor = p_floor,
      location_label = format('Gedung %s · Lantai %s', v_building, p_floor),
      capacity = p_capacity,
      facilities = coalesce(p_facilities, '{}'),
      price_per_hour = greatest(0, coalesce(p_price_per_hour, 0)),
      price_note = coalesce(nullif(trim(p_price_note), ''), 'Mahasiswa FEB gratis'),
      description = coalesce(trim(p_description), ''),
      image_url = coalesce(nullif(trim(p_image_url), ''), '/images/room-1.jpg')
    WHERE code = trim(p_original_code)
    RETURNING * INTO v_room;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Ruangan asal tidak ditemukan.');
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.rooms WHERE lower(code) = lower(v_code)) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Kode ruangan tersebut sudah digunakan.');
    END IF;

    INSERT INTO public.rooms (
      code, building, floor, location_label, capacity, facilities,
      price_per_hour, price_note, description, image_url
    )
    VALUES (
      v_code, v_building, p_floor, format('Gedung %s · Lantai %s', v_building, p_floor),
      p_capacity, coalesce(p_facilities, '{}'),
      greatest(0, coalesce(p_price_per_hour, 0)),
      coalesce(nullif(trim(p_price_note), ''), 'Mahasiswa FEB gratis'),
      coalesce(trim(p_description), ''),
      coalesce(nullif(trim(p_image_url), ''), '/images/room-1.jpg')
    )
    RETURNING * INTO v_room;
  END IF;

  RETURN jsonb_build_object('ok', true, 'room', to_jsonb(v_room));
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 7: admin_delete_room_safe (Pengelola: Hapus Ruangan)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_room_safe(
  p_admin_pin text,
  p_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF lower(trim(coalesce(p_admin_pin, ''))) <> 'feb2026' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN Pengelola tidak valid.');
  END IF;

  DELETE FROM public.rooms WHERE code = trim(coalesce(p_code, ''));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan tidak ditemukan.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'code', p_code);
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 8: admin_create_block_safe (Pengelola: Blokir / Booking Jadwal Fakultas)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_block_safe(
  p_admin_pin text,
  p_id text,
  p_room_code text,
  p_booking_date date,
  p_start_hour int,
  p_duration int,
  p_purpose text,
  p_pic_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_booking_id text;
BEGIN
  IF lower(trim(coalesce(p_admin_pin, ''))) <> 'feb2026' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN Pengelola tidak valid.');
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE code = p_room_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ruangan tidak ditemukan.');
  END IF;

  IF p_start_hour < 7 OR p_start_hour > 16 OR p_duration < 1 OR p_duration > 3 OR (p_start_hour + p_duration) > 17 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Jam blokir harus antara 07.00–17.00 WIB (1–3 jam).');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_room_code || ':' || p_booking_date::text));

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE room_code = p_room_code
      AND booking_date = p_booking_date
      AND status = 'confirmed'
      AND start_hour < (p_start_hour + p_duration)
      AND (start_hour + duration) > p_start_hour
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Slot tersebut sedang memiliki booking aktif. Batalkan booking terkait terlebih dahulu.');
  END IF;

  v_booking_id := coalesce(nullif(trim(p_id), ''), 'SH-' || upper(substr(md5(gen_random_uuid()::text), 1, 5)));

  INSERT INTO public.bookings (
    id, room_code, booking_date, start_hour, duration,
    user_email, user_name, nim, purpose, participants, status
  )
  VALUES (
    v_booking_id, p_room_code, p_booking_date, p_start_hour, p_duration,
    'pengelola@unnes.ac.id',
    coalesce(nullif(trim(p_pic_name), ''), 'Pengelola FEB'),
    '19880412',
    coalesce(nullif(trim(p_purpose), ''), 'Kegiatan Fakultas FEB'),
    v_room.capacity,
    'confirmed'
  )
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object('ok', true, 'booking', to_jsonb(v_booking));
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 9: admin_manage_status_safe (Pengelola: Batalkan/Hapus Booking & Selesaikan Laporan)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_manage_status_safe(
  p_admin_pin text,
  p_action text,
  p_target_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF lower(trim(coalesce(p_admin_pin, ''))) <> 'feb2026' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN Pengelola tidak valid.');
  END IF;

  IF p_action = 'cancel_booking' THEN
    UPDATE public.bookings SET status = 'cancelled' WHERE id = p_target_id;
    RETURN jsonb_build_object('ok', true);
  ELSIF p_action = 'delete_booking' THEN
    DELETE FROM public.bookings WHERE id = p_target_id;
    RETURN jsonb_build_object('ok', true);
  ELSIF p_action = 'resolve_report' THEN
    DELETE FROM public.room_reports WHERE id::text = p_target_id;
    RETURN jsonb_build_object('ok', true);
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'Aksi pengelola tidak dikenali.');
END;
$$;

-- Berikan izin eksekusi RPC ke anon & authenticated
GRANT EXECUTE ON FUNCTION public.auth_unnes_user(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_safe(text, text, date, int, int, text, text, text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_safe(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_room_used_safe(text, date, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_favorite_safe(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_room_safe(text, text, text, text, int, int, text[], int, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_room_safe(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_block_safe(text, text, text, date, int, int, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_status_safe(text, text, text) TO anon, authenticated;
