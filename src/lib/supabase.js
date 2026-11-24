import { createClient } from '@supabase/supabase-js';
import { FALLBACK_ROOMS, MAX_ACTIVE_BOOKINGS } from './constants';
import { getNowWib } from './dateWib';
import { deriveNameFromEmail, generateBookingCode, isValidNim, isValidUnnesEmail, normalizeEmail } from './validation';
import { canCancelBooking, isBookingActive } from './schedule';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_PUBLIC_KEY');

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// ============================================================================
// FALLBACK DEMO LOKAL (Aktif otomatis jika .env Supabase belum dikonfigurasi)
// ============================================================================
const LS_KEYS = {
  users: 'spacehub_local_users_v1',
  bookings: 'spacehub_local_bookings_v1',
  reports: 'spacehub_local_reports_v1',
  favorites: 'spacehub_local_favorites_v1',
};

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Abaikan quota error
  }
}

function ensureLocalDemoUser() {
  const users = readLocal(LS_KEYS.users, []);
  if (!users.some((u) => u.email === 'mahasiswa@student.unnes.ac.id')) {
    users.push({
      email: 'mahasiswa@student.unnes.ac.id',
      name: 'Mahasiswa FEB',
      nim: '7101422001',
      password: 'contoh123',
    });
    writeLocal(LS_KEYS.users, users);
  }
  return users;
}

// ============================================================================
// DATA ACCESS LAYER (Supabase RPC SECURITY DEFINER + Fallback Lokal)
// ============================================================================

export async function authUnnesUser({ email, password, fullName = '', mode = 'login' }) {
  const cleanEmail = normalizeEmail(email);
  if (!isValidUnnesEmail(cleanEmail)) {
    return { ok: false, error: 'Gunakan email UNNES (@student.unnes.ac.id, @mail.unnes.ac.id, atau @unnes.ac.id).' };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: 'Password minimal 6 karakter.' };
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('auth_unnes_user', {
      p_email: cleanEmail,
      p_password: password,
      p_full_name: fullName.trim() || null,
      p_mode: mode,
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal menghubungi server Supabase.' };
    }
    return data;
  }

  // Fallback lokal
  const users = ensureLocalDemoUser();
  const existing = users.find((u) => u.email === cleanEmail);

  if (mode === 'register') {
    if (existing) {
      return { ok: false, error: 'Email UNNES ini sudah terdaftar. Silakan pindah ke tab Masuk.' };
    }
    const newUser = {
      email: cleanEmail,
      name: fullName.trim() || deriveNameFromEmail(cleanEmail),
      nim: '',
      password,
    };
    users.push(newUser);
    writeLocal(LS_KEYS.users, users);
    return { ok: true, user: { email: newUser.email, name: newUser.name, nim: newUser.nim } };
  }

  if (!existing) {
    return { ok: false, error: 'Email belum terdaftar. Silakan daftar terlebih dahulu di tab Daftar.' };
  }
  if (existing.password !== password) {
    return { ok: false, error: 'Password tidak sesuai. Periksa kembali password Anda.' };
  }
  return { ok: true, user: { email: existing.email, name: existing.name, nim: existing.nim || '' } };
}

export async function fetchAllData(userEmail) {
  const cleanEmail = normalizeEmail(userEmail);

  if (isSupabaseConfigured && supabase) {
    const [roomsRes, bookingsRes, reportsRes, favsRes] = await Promise.all([
      supabase.from('rooms').select('*').order('building').order('floor').order('code'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('room_reports').select('*').order('created_at', { ascending: false }),
      cleanEmail
        ? supabase.from('user_favorites').select('room_code').eq('user_email', cleanEmail)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (roomsRes.error) throw roomsRes.error;
    if (bookingsRes.error) throw bookingsRes.error;
    if (reportsRes.error) throw reportsRes.error;
    if (favsRes.error) throw favsRes.error;

    return {
      rooms: roomsRes.data && roomsRes.data.length > 0 ? roomsRes.data : FALLBACK_ROOMS,
      bookings: bookingsRes.data || [],
      reports: reportsRes.data || [],
      favorites: new Set((favsRes.data || []).map((f) => f.room_code)),
    };
  }

  // Fallback lokal
  const bookings = readLocal(LS_KEYS.bookings, []);
  const reports = readLocal(LS_KEYS.reports, []);
  const favMap = readLocal(LS_KEYS.favorites, {});
  const userFavs = cleanEmail && Array.isArray(favMap[cleanEmail]) ? favMap[cleanEmail] : [];

  return {
    rooms: FALLBACK_ROOMS,
    bookings,
    reports,
    favorites: new Set(userFavs),
  };
}

export async function createBookingSafe(payload) {
  const bookingId = generateBookingCode();
  const cleanEmail = normalizeEmail(payload.userEmail);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_booking_safe', {
      p_id: bookingId,
      p_room_code: payload.roomCode,
      p_booking_date: payload.bookingDate,
      p_start_hour: payload.startHour,
      p_duration: payload.duration,
      p_user_email: cleanEmail,
      p_user_name: payload.userName,
      p_nim: String(payload.nim).trim(),
      p_purpose: payload.purpose.trim(),
      p_participants: Number(payload.participants),
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal menyimpan booking ke server.' };
    }
    return data;
  }

  // Fallback lokal dengan validasi setara RPC server
  const { dateKey: todayWib, hour: nowHourWib } = getNowWib();
  const room = FALLBACK_ROOMS.find((r) => r.code === payload.roomCode);
  if (!room) return { ok: false, error: 'Ruangan tidak ditemukan.' };
  if (!isValidNim(payload.nim)) return { ok: false, error: 'NIM harus berupa angka 8 sampai 12 digit.' };
  if (!payload.purpose.trim()) return { ok: false, error: 'Keperluan booking wajib diisi.' };
  const participants = Number(payload.participants);
  if (!participants || participants < 1 || participants > room.capacity) {
    return { ok: false, error: `Jumlah peserta harus 1 sampai ${room.capacity} orang.` };
  }
  if (payload.bookingDate === todayWib && payload.startHour < nowHourWib) {
    return { ok: false, error: 'Jam mulai yang dipilih sudah lewat.' };
  }

  const bookings = readLocal(LS_KEYS.bookings, []);
  const reports = readLocal(LS_KEYS.reports, []);

  const activeCount = bookings.filter(
    (b) => b.user_email.toLowerCase() === cleanEmail && isBookingActive(b, todayWib, nowHourWib)
  ).length;
  if (activeCount >= MAX_ACTIVE_BOOKINGS) {
    return {
      ok: false,
      error: `Kuota maksimal ${MAX_ACTIVE_BOOKINGS} booking aktif sudah tercapai. Batalkan salah satu terlebih dahulu.`,
    };
  }

  const endHour = payload.startHour + payload.duration;
  const hasBookingConflict = bookings.some(
    (b) =>
      b.status === 'confirmed' &&
      b.room_code === payload.roomCode &&
      b.booking_date === payload.bookingDate &&
      b.start_hour < endHour &&
      b.start_hour + b.duration > payload.startHour
  );
  if (hasBookingConflict) {
    return { ok: false, error: 'Maaf, jam ini baru saja dibooking pengguna lain.' };
  }

  const hasReportConflict = reports.some(
    (r) =>
      r.room_code === payload.roomCode &&
      r.report_date === payload.bookingDate &&
      r.report_hour >= payload.startHour &&
      r.report_hour < endHour
  );
  if (hasReportConflict) {
    return { ok: false, error: 'Ruangan dilaporkan sedang terpakai pada jam tersebut.' };
  }

  const newBooking = {
    id: bookingId,
    room_code: payload.roomCode,
    booking_date: payload.bookingDate,
    start_hour: payload.startHour,
    duration: payload.duration,
    user_email: cleanEmail,
    user_name: payload.userName,
    nim: String(payload.nim).trim(),
    purpose: payload.purpose.trim(),
    participants,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  };

  bookings.unshift(newBooking);
  writeLocal(LS_KEYS.bookings, bookings);
  return { ok: true, booking: newBooking };
}

export async function cancelBookingSafe({ bookingId, userEmail }) {
  const cleanEmail = normalizeEmail(userEmail);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('cancel_booking_safe', {
      p_id: bookingId,
      p_user_email: cleanEmail,
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal membatalkan booking.' };
    }
    return data;
  }

  const { dateKey: todayWib, hour: nowHourWib } = getNowWib();
  const bookings = readLocal(LS_KEYS.bookings, []);
  const target = bookings.find((b) => b.id === bookingId && b.user_email.toLowerCase() === cleanEmail);
  if (!target) return { ok: false, error: 'Data booking tidak ditemukan.' };
  if (!canCancelBooking(target, todayWib, nowHourWib)) {
    return { ok: false, error: 'Booking yang sudah dimulai atau lewat tidak dapat dibatalkan.' };
  }
  target.status = 'cancelled';
  writeLocal(LS_KEYS.bookings, bookings);
  return { ok: true, id: bookingId };
}

export async function reportRoomUsedSafe({ roomCode, reportDate, reportHour, reportedBy }) {
  const cleanEmail = normalizeEmail(reportedBy);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('report_room_used_safe', {
      p_room_code: roomCode,
      p_report_date: reportDate,
      p_report_hour: reportHour,
      p_reported_by: cleanEmail,
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal mengirim laporan.' };
    }
    return data;
  }

  const reports = readLocal(LS_KEYS.reports, []);
  const dup = reports.some(
    (r) => r.room_code === roomCode && r.report_date === reportDate && r.report_hour === reportHour
  );
  if (!dup) {
    reports.unshift({
      id: `rep-${Date.now()}`,
      room_code: roomCode,
      report_date: reportDate,
      report_hour: reportHour,
      reported_by: cleanEmail,
      created_at: new Date().toISOString(),
    });
    writeLocal(LS_KEYS.reports, reports);
  }
  return { ok: true };
}

export async function toggleFavoriteSafe({ userEmail, roomCode }) {
  const cleanEmail = normalizeEmail(userEmail);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('toggle_favorite_safe', {
      p_user_email: cleanEmail,
      p_room_code: roomCode,
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal memperbarui favorit.' };
    }
    return data;
  }

  const favMap = readLocal(LS_KEYS.favorites, {});
  const set = new Set(Array.isArray(favMap[cleanEmail]) ? favMap[cleanEmail] : []);
  let favorited = false;
  if (set.has(roomCode)) {
    set.delete(roomCode);
    favorited = false;
  } else {
    set.add(roomCode);
    favorited = true;
  }
  favMap[cleanEmail] = Array.from(set);
  writeLocal(LS_KEYS.favorites, favMap);
  return { ok: true, favorited };
}
