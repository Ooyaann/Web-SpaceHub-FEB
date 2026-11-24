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
    if (maxDuration > 0 && duration > maxDuration) setDuration(maxDuration);
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

    if (!isValidNim(nim)) return setError('NIM wajib 8–12 digit angka.');
    if (!purpose.trim()) return setError('Isi keperluan pemakaian.');
    const ppl = Number(participants);
    if (!ppl || ppl < 1 || ppl > room.capacity) return setError(`Peserta harus 1–${room.capacity} orang.`);
    if (myActiveBookingCount >= MAX_ACTIVE_BOOKINGS) return setError(`Kuota ${MAX_ACTIVE_BOOKINGS} booking aktif penuh.`);

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

      <form onSubmit={handleSubmit} className="sh-card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-light pb-4 dark:border-unnes-night-line">
          <div>
            <h1 className="font-mono text-xl font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">
              Booking {room.code}
            </h1>
            <p className="text-xs text-[#526382] dark:text-unnes-night-muted">
              {room.location_label} · Maks. {room.capacity} kursi
            </p>
          </div>
          <span className="rounded-md bg-surface-subtle px-3 py-1 font-mono text-xs font-bold text-[#1B2B4B] dark:bg-unnes-night-input dark:text-unnes-gold">
            Kuota {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </span>
        </div>

        <div className="max-w-xs">
          <DatePickerPopover
            label="Tanggal Pemakaian"
            days={days}
            value={dayIndex}
            onChange={(idx) => setDayIndex(idx)}
          />
        </div>

        {freeStartHours.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-light p-6 text-center text-xs text-[#526382] dark:border-unnes-night-line dark:text-unnes-night-muted">
            Semua slot pada <strong>{selectedDay.label}</strong> sudah terisi atau lewat. Pilih tanggal lain.
          </div>
        ) : (
          <>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                Jam Mulai
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
                      className={`rounded-lg border px-2 py-2 text-center transition ${
                        isSelected
                          ? 'border-unnes-royal bg-unnes-royal text-white dark:border-unnes-gold dark:bg-unnes-gold dark:text-unnes-gold-ink'
                          : isFree
                            ? 'border-line-light bg-white text-[#0F1B33] hover:border-unnes-royal dark:border-unnes-night-line dark:bg-unnes-night-input dark:text-[#F1F5FB] dark:hover:border-unnes-gold'
                            : 'cursor-not-allowed border-transparent bg-surface-subtle text-[#8B9AB5] line-through opacity-55 dark:bg-[#0D1628] dark:text-[#4D6085]'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold">{formatHour(hour)}</div>
                      {!isFree && <div className="text-[9px] no-underline">{SLOT_LABELS[status]}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                Durasi
              </span>
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
                      className={`rounded-lg border px-3 py-2 text-center transition ${
                        selected
                          ? 'border-unnes-royal bg-unnes-royal text-white dark:border-unnes-gold dark:bg-unnes-gold dark:text-unnes-gold-ink'
                          : allowed
                            ? 'border-line-light bg-white text-[#0F1B33] hover:border-unnes-royal dark:border-unnes-night-line dark:bg-unnes-night-input dark:text-[#F1F5FB] dark:hover:border-unnes-gold'
                            : 'cursor-not-allowed border-transparent bg-surface-subtle text-[#8B9AB5] opacity-50 dark:bg-[#0D1628]'
                      }`}
                    >
                      <div className="text-xs font-bold">{d} Jam</div>
                      {allowed && (
                        <div className="font-mono text-[10px] opacity-80">{formatHourRange(startHour, d)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line-light bg-surface-subtle/70 px-4 py-2.5 text-xs dark:border-unnes-night-line dark:bg-unnes-night-input">
              <span className="flex items-center gap-1.5 font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                <Tag className="h-3.5 w-3.5" />
                Estimasi Tarif ({duration} jam)
              </span>
              <span className="font-mono font-bold text-[#0F1B33] dark:text-unnes-gold">
                {pricePerHour > 0 ? formatRupiah(estimatedPrice) : 'Gratis Mahasiswa FEB'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                  Nama
                </span>
                <input type="text" value={user?.name || ''} readOnly className="sh-control opacity-75" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                  NIM
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="8–12 digit angka"
                  className="sh-control font-mono"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
                  Keperluan
                </span>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Mis. Diskusi kelompok Akuntansi"
                  className="sh-control"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#3C4E70] dark:text-unnes-night-muted">
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
                  className="sh-control font-mono"
                />
              </label>
            </div>

            <BookingRulesPills />

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="sh-btn-primary w-full">
              <CalendarCheck2 className="h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Konfirmasi Booking'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
