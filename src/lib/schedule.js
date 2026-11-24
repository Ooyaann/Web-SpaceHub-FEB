import { OPERATIONAL_HOURS } from './constants.js';

/**
 * Hash FNV-1a 32-bit deterministik (identik lintas perangkat)
 * untuk menghasilkan jadwal kuliah contoh FEB UNNES.
 */
export function fnvHash(str) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Menentukan apakah suatu ruangan memiliki jadwal kuliah contoh pada jam tertentu.
 * Hari Minggu selalu bebas kuliah; ~30% ruang per tanggal kosong seharian dari kuliah.
 */
export function isDemoClassHour(roomCode, dateKey, weekday, hour) {
  if (weekday === 0) return false;
  if (fnvHash(`${roomCode}${dateKey}u`) % 100 < 30) return false;
  const slot = Math.floor((hour - 7) / 2);
  const threshold = weekday === 6 ? 20 : 45;
  return fnvHash(`${roomCode}${dateKey}${slot}`) % 100 < threshold;
}

/**
 * Status slot tanpa memotong jam yang sudah lewat hari ini.
 * Prioritas:
 * 1. Booking confirmed milik user saat ini ('m')
 * 2. Booking confirmed milik user lain ('o')
 * 3. Laporan ruang sedang terpakai ('o')
 * 4. Jadwal kuliah contoh ('k')
 * 5. Kosong ('f')
 */
export function getRawSlotStatus({
  roomCode,
  dateKey,
  weekday,
  hour,
  bookings,
  reports,
  userEmail,
}) {
  const normalizedUser = (userEmail || '').toLowerCase();

  for (const b of bookings) {
    if (
      b.status === 'confirmed' &&
      b.room_code === roomCode &&
      b.booking_date === dateKey &&
      hour >= b.start_hour &&
      hour < b.start_hour + b.duration
    ) {
      if (normalizedUser && (b.user_email || '').toLowerCase() === normalizedUser) {
        return 'm';
      }
      return 'o';
    }
  }

  for (const rep of reports) {
    if (
      rep.room_code === roomCode &&
      rep.report_date === dateKey &&
      rep.report_hour === hour
    ) {
      return 'o';
    }
  }

  if (isDemoClassHour(roomCode, dateKey, weekday, hour)) {
    return 'k';
  }

  return 'f';
}

/**
 * Status slot termasuk penandaan 'p' (Sudah lewat) jika tanggal = hari ini dan hour < nowHourWib.
 */
export function getSlotStatus(params) {
  const { dateKey, hour, todayWib, nowHourWib } = params;
  if (dateKey === todayWib && hour < nowHourWib) {
    return 'p';
  }
  return getRawSlotStatus(params);
}

/**
 * Validasi jendela waktu booking: seluruh jam [startHour, startHour + duration)
 * wajib berstatus 'f' (Kosong) — otomatis memblokir 'k' (Ada kelas), 'o', 'm', dan 'p'.
 */
export function isWindowFree(params) {
  const { startHour, duration } = params;
  if (startHour < 7 || startHour > 15 || duration < 1 || duration > 3) return false;
  for (let h = startHour; h < startHour + duration; h += 1) {
    if (h > 16) return false;
    if (getSlotStatus({ ...params, hour: h }) !== 'f') return false;
  }
  return true;
}

/**
 * Menghitung sampai pukul berapa ruangan terus kosong mulai dari startHour.
 */
export function getFreeUntilHour(params) {
  let h = params.startHour;
  while (h <= 16 && getSlotStatus({ ...params, hour: h }) === 'f') {
    h += 1;
  }
  return h;
}

/**
 * Menghitung durasi maksimum (1..3 jam) yang tersedia berurutan mulai dari startHour.
 */
export function getMaxConsecutiveDuration(params) {
  let max = 0;
  for (let h = params.startHour; h <= 16 && max < 3; h += 1) {
    if (getSlotStatus({ ...params, hour: h }) !== 'f') break;
    max += 1;
  }
  return max;
}

/**
 * Mengecek apakah ruangan kosong seharian penuh (07.00–16.00) pada tanggal tersebut.
 */
export function isRoomIdleAllDay({ roomCode, dateKey, weekday, bookings, reports, userEmail }) {
  return OPERATIONAL_HOURS.every(
    (hour) =>
      getRawSlotStatus({ roomCode, dateKey, weekday, hour, bookings, reports, userEmail }) === 'f'
  );
}

/**
 * Ringkasan harian seluruh ruangan untuk tampilan Kalender 31 hari & Admin.
 */
export function getDaySummary({ rooms, dateKey, weekday, bookings, reports, userEmail }) {
  const withClass = [];
  const withBooking = [];
  const idleRooms = [];

  for (const room of rooms) {
    let hasClass = false;
    let hasBooking = false;

    for (const hour of OPERATIONAL_HOURS) {
      const st = getRawSlotStatus({
        roomCode: room.code,
        dateKey,
        weekday,
        hour,
        bookings,
        reports,
        userEmail,
      });
      if (st === 'k') hasClass = true;
      if (st === 'o' || st === 'm') hasBooking = true;
    }

    if (hasClass) withClass.push(room.code);
    if (hasBooking) withBooking.push(room.code);
    if (!hasClass && !hasBooking) idleRooms.push(room.code);
  }

  return { withClass, withBooking, idleRooms };
}

export function isBookingActive(booking, todayWib, nowHourWib) {
  if (booking.status !== 'confirmed') return false;
  if (booking.booking_date > todayWib) return true;
  if (booking.booking_date === todayWib && booking.start_hour + booking.duration > nowHourWib) {
    return true;
  }
  return false;
}

export function canCancelBooking(booking, todayWib, nowHourWib) {
  if (booking.status !== 'confirmed') return false;
  if (booking.booking_date > todayWib) return true;
  if (booking.booking_date === todayWib && nowHourWib < booking.start_hour) return true;
  return false;
}
