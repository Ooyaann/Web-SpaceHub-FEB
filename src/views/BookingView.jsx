import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck2, Info, Tag } from 'lucide-react';
import { BOOKING_RULES_TEXT, MAX_ACTIVE_BOOKINGS, START_HOURS } from '../lib/constants';
import { formatHour, formatHourRange, formatRupiah } from '../lib/dateWib';
import { getMaxConsecutiveDuration, getSlotStatus } from '../lib/schedule';
import { isValidNim } from '../lib/validation';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function BookingView() {
  const {
    rooms,
    bookings,
    reports,
    user,
    days,
    nowWib,
    filters,
    selectedRoomCode,
    bookingPresetDay,
    myActiveBookingCount,
    openRoomDetail,
    submitBooking,
  } = useSpaceHub();

  const room = rooms.find((r) => r.code === selectedRoomCode) || rooms[0];
  const [dayIndex, setDayIndex] = useState(bookingPresetDay ?? filters.day ?? 0);

  const selectedDay = days[dayIndex] || days[0];

  // Hanya jam mulai berstatus 'f' (Kosong) — otomatis memblokir 'k' (Ada kelas), 'o', 'm', dan 'p'
  const freeStartHours = useMemo(() => {
    if (!room) return [];
    return START_HOURS.filter(
      (h) =>
        getSlotStatus({
          roomCode: room.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          hour: h,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        }) === 'f'
    );
  }, [room, selectedDay, bookings, reports, user, nowWib]);

  const [startHour, setStartHour] = useState(() =>
    freeStartHours.includes(filters.start) ? filters.start : freeStartHours[0] ?? 7
  );

  useEffect(() => {
    if (freeStartHours.length > 0 && !freeStartHours.includes(startHour)) {
      setStartHour(freeStartHours.includes(filters.start) ? filters.start : freeStartHours[0]);
    }
  }, [freeStartHours, startHour, filters.start]);

  const maxDuration = useMemo(() => {
    if (!room || !freeStartHours.includes(startHour)) return 0;
    return getMaxConsecutiveDuration({
      roomCode: room.code,
      dateKey: selectedDay.key,
      weekday: selectedDay.weekday,
      startHour,
      bookings,
      reports,
      userEmail: user?.email,
      todayWib: nowWib.dateKey,
      nowHourWib: nowWib.hour,
    });
  }, [room, freeStartHours, startHour, selectedDay, bookings, reports, user, nowWib]);

  const [duration, setDuration] = useState(Math.min(filters.dur || 2, Math.max(1, maxDuration)));

  useEffect(() => {
    if (maxDuration > 0 && duration > maxDuration) {
      setDuration(maxDuration);
    }
  }, [maxDuration, duration]);

  const [nim, setNim] = useState(user?.nim || '');
  const [purpose, setPurpose] = useState('');
  const [participants, setParticipants] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!room) return null;

  const pricePerHour = Number(room.price_per_hour) || 0;
  const estimatedPrice = pricePerHour * duration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidNim(nim)) {
      setError('NIM harus berupa angka 8 sampai 12 digit.');
      return;
    }
    if (!purpose.trim()) {
      setError('Keperluan booking wajib diisi.');
      return;
    }
    const ppl = Number(participants);
    if (!ppl || ppl < 1 || ppl > room.capacity) {
      setError(`Jumlah peserta harus antara 1 sampai ${room.capacity} orang.`);
      return;
    }
    if (myActiveBookingCount >= MAX_ACTIVE_BOOKINGS) {
      setError(`Booking aktif sudah mencapai batas maksimal ${MAX_ACTIVE_BOOKINGS}. Batalkan salah satu terlebih dahulu.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitBooking({
        roomCode: room.code,
        dayIndex,
        startHour,
        duration,
        nim,
        purpose,
        participants: ppl,
      });
      if (!res?.ok) {
        setError(res?.error || 'Booking gagal diproses. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button type="button" onClick={() => openRoomDetail(room.code, dayIndex)} className="sh-chip">
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke detail {room.code}
      </button>

      {freeStartHours.length === 0 ? (
        <div className="sh-card space-y-3 p-6 text-center">
          <h2 className="text-lg font-extrabold text-[#0f1d3d] dark:text-white">
            Tidak ada slot kosong di {room.code} pada {selectedDay.label}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Semua jam operasional sudah terisi jadwal kuliah, dibooking, atau sudah lewat. Silakan ganti tanggal di
            bawah ini.
          </p>
          <div className="mx-auto max-w-xs">
            <select
              value={dayIndex}
              onChange={(e) => setDayIndex(Number(e.target.value))}
              className="sh-input"
            >
              {days.map((d) => (
                <option key={d.key} value={d.index}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="sh-card space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-unnes-border pb-4 dark:border-unnes-border-dark">
            <div>
              <h2 className="text-xl font-extrabold text-[#0f1d3d] dark:text-white">
                Booking Ruang {room.code}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Kapasitas maks. {room.capacity} orang · {room.location_label}
              </p>
            </div>
            <span className="rounded-full bg-[#e6eeff] px-3 py-1 text-xs font-bold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light">
              Kuota aktif: {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
            </span>
          </div>

          {/* Waktu Booking */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Tanggal</span>
              <select
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                className="sh-input"
              >
                {days.map((d) => (
                  <option key={d.key} value={d.index}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Jam Mulai (Hanya Slot Kosong)
              </span>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="sh-input"
              >
                {freeStartHours.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)} WIB
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Durasi</span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="sh-input"
              >
                {[1, 2, 3]
                  .filter((d) => d <= maxDuration)
                  .map((d) => (
                    <option key={d} value={d}>
                      {d} jam ({formatHourRange(startHour, d)})
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {/* Ringkasan Tarif */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-200">
              <Tag className="h-4 w-4 text-amber-700 dark:text-unnes-gold" />
              <span>Estimasi Tarif ({duration} jam)</span>
            </div>
            <div className="font-extrabold text-unnes-navy dark:text-unnes-gold">
              {pricePerHour > 0 ? formatRupiah(estimatedPrice) : 'Gratis (Mahasiswa FEB)'}
            </div>
          </div>

          {/* Data Pemesan */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Pemesan</span>
              <input type="text" value={user?.name || ''} readOnly className="sh-input opacity-80" />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                NIM (8–12 digit angka)
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Contoh: 7101422001"
                className="sh-input"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Keperluan Pemakaian
              </span>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Diskusi kelompok Akuntansi Biaya"
                className="sh-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Jumlah Peserta
              </span>
              <input
                type="number"
                min={1}
                max={room.capacity}
                required
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder={`1–${room.capacity}`}
                className="sh-input"
              />
            </label>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-unnes-surface p-3 text-[11px] text-slate-600 dark:bg-[#0d1730] dark:text-slate-300">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-unnes-blue dark:text-unnes-blue-light" />
            <span>{BOOKING_RULES_TEXT}</span>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="sh-btn-primary w-full py-3">
            <CalendarCheck2 className="h-4 w-4" />
            {submitting ? 'Memeriksa ketersediaan & menyimpan...' : 'Konfirmasi Booking Ruang'}
          </button>
        </form>
      )}
    </div>
  );
}
