import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck2, Tag } from 'lucide-react';
import { MAX_ACTIVE_BOOKINGS, SLOT_LABELS, START_HOURS } from '../lib/constants';
import { formatHour, formatHourRange, formatRupiah } from '../lib/dateWib';
import { getMaxConsecutiveDuration, getSlotStatus } from '../lib/schedule';
import { isValidNim } from '../lib/validation';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import BookingRulesPills from '../components/BookingRulesPills';

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
    bookingPresetHour,
    myActiveBookingCount,
    openRoomDetail,
    submitBooking,
  } = useSpaceHub();

  const room = rooms.find((r) => r.code === selectedRoomCode) || rooms[0];
  const [dayIndex, setDayIndex] = useState(bookingPresetDay ?? filters.day ?? 0);

  const selectedDay = days[dayIndex] || days[0];

  const slotStatuses = useMemo(() => {
    if (!room) return [];
    return START_HOURS.map((h) => ({
      hour: h,
      status: getSlotStatus({
        roomCode: room.code,
        dateKey: selectedDay.key,
        weekday: selectedDay.weekday,
        hour: h,
        bookings,
        reports,
        userEmail: user?.email,
        todayWib: nowWib.dateKey,
        nowHourWib: nowWib.hour,
      }),
    }));
  }, [room, selectedDay, bookings, reports, user, nowWib]);

  const freeStartHours = useMemo(
    () => slotStatuses.filter((s) => s.status === 'f').map((s) => s.hour),
    [slotStatuses]
  );

  const [startHour, setStartHour] = useState(() => {
    if (bookingPresetHour && freeStartHours.includes(bookingPresetHour)) return bookingPresetHour;
    if (freeStartHours.includes(filters.start)) return filters.start;
    return freeStartHours[0] ?? 7;
  });

  useEffect(() => {
    if (bookingPresetHour && freeStartHours.includes(bookingPresetHour)) {
      setStartHour(bookingPresetHour);
    } else if (freeStartHours.length > 0 && !freeStartHours.includes(startHour)) {
      setStartHour(freeStartHours.includes(filters.start) ? filters.start : freeStartHours[0]);
    }
  }, [freeStartHours, startHour, filters.start, bookingPresetHour]);

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
      setError('NIM wajib 8–12 digit angka.');
      return;
    }
    if (!purpose.trim()) {
      setError('Isi keperluan pemakaian.');
      return;
    }
    const ppl = Number(participants);
    if (!ppl || ppl < 1 || ppl > room.capacity) {
      setError(`Peserta harus 1–${room.capacity} orang.`);
      return;
    }
    if (myActiveBookingCount >= MAX_ACTIVE_BOOKINGS) {
      setError(`Kuota ${MAX_ACTIVE_BOOKINGS} booking aktif penuh.`);
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
      if (!res?.ok) setError(res?.error || 'Booking gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button type="button" onClick={() => openRoomDetail(room.code, dayIndex)} className="sh-chip">
        <ArrowLeft className="h-3.5 w-3.5" />
        Detail {room.code}
      </button>

      <form onSubmit={handleSubmit} className="sh-card space-y-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-unnes-border pb-4 dark:border-unnes-border-dark">
          <div>
            <h2 className="text-xl font-extrabold text-[#0f1d3d] dark:text-white">Booking {room.code}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {room.location_label} · Maks. {room.capacity} kursi
            </p>
          </div>
          <span className="rounded-full bg-[#e6eeff] px-3 py-1 text-xs font-bold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light">
            Kuota {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </span>
        </div>

        {/* Date Picker */}
        <div className="max-w-xs">
          <DatePickerPopover
            label="Tanggal Pemakaian"
            days={days}
            value={dayIndex}
            onChange={(idx) => setDayIndex(idx)}
          />
        </div>

        {freeStartHours.length === 0 ? (
          <div className="rounded-xl border border-dashed border-unnes-border p-6 text-center text-xs text-slate-500 dark:border-unnes-border-dark dark:text-slate-400">
            Semua slot pada <strong>{selectedDay.label}</strong> sudah terisi atau lewat. Pilih tanggal lain di atas.
          </div>
        ) : (
          <>
            {/* Interactive Time Slot Grid */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pilih Jam Mulai
              </span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slotStatuses.map(({ hour, status }) => {
                  const isFree = status === 'f';
                  const isSelected = isFree && startHour === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={!isFree}
                      onClick={() => setStartHour(hour)}
                      title={isFree ? `Pilih ${formatHour(hour)}` : SLOT_LABELS[status]}
                      className={`rounded-xl border px-2 py-2 text-center transition ${
                        isSelected
                          ? 'border-unnes-gold bg-unnes-gold text-unnes-gold-ink shadow-sm'
                          : isFree
                            ? 'border-unnes-border bg-white text-[#0f1d3d] hover:border-unnes-blue dark:border-unnes-border-dark dark:bg-[#0d1730] dark:text-white'
                            : 'cursor-not-allowed border-transparent bg-slate-100 text-slate-400 line-through opacity-60 dark:bg-slate-800/60 dark:text-slate-500'
                      }`}
                    >
                      <div className="text-xs font-extrabold tabular-nums">{formatHour(hour)}</div>
                      {!isFree && <div className="text-[9px] no-underline">{SLOT_LABELS[status]}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segmented Duration */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Durasi</span>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((d) => {
                  const allowed = d <= maxDuration;
                  const selected = duration === d && allowed;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setDuration(d)}
                      className={`rounded-xl border px-3 py-2 text-center transition ${
                        selected
                          ? 'border-unnes-navy bg-unnes-navy text-white dark:border-unnes-gold dark:bg-unnes-gold dark:text-unnes-gold-ink'
                          : allowed
                            ? 'border-unnes-border bg-white text-[#0f1d3d] hover:border-unnes-blue dark:border-unnes-border-dark dark:bg-[#0d1730] dark:text-slate-200'
                            : 'cursor-not-allowed border-transparent bg-slate-100 text-slate-400 opacity-50 dark:bg-slate-800/60'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{d} Jam</div>
                      {allowed && (
                        <div className="text-[10px] opacity-80">{formatHourRange(startHour, d)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimasi Tarif */}
            <div className="flex items-center justify-between rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-2.5 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="flex items-center gap-1.5 font-semibold text-amber-950 dark:text-amber-200">
                <Tag className="h-3.5 w-3.5" />
                Estimasi Tarif ({duration} jam)
              </span>
              <span className="font-extrabold text-unnes-navy dark:text-unnes-gold">
                {pricePerHour > 0 ? formatRupiah(estimatedPrice) : 'Gratis FEB'}
              </span>
            </div>

            {/* Form Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nama</span>
                <input type="text" value={user?.name || ''} readOnly className="sh-input opacity-75" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">NIM</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="8–12 digit angka"
                  className="sh-input"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Keperluan</span>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Mis. Diskusi kelompok Akuntansi"
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

            <BookingRulesPills />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="sh-btn-primary w-full py-3">
              <CalendarCheck2 className="h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Konfirmasi Booking'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
