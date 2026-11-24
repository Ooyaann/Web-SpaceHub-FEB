import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarCheck2, DoorOpen } from 'lucide-react';
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
    previousView,
    backLabel,
    goBack,
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
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Contextual Back Bar + Optional Room Detail Link */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={goBack} className="sh-btn-secondary h-9 px-3.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke {backLabel}
        </button>

        {previousView !== 'det' && (
          <button
            type="button"
            onClick={() => openRoomDetail(room.code, dayIndex)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-unnes-navy transition hover:bg-[#EEF3FC] dark:text-unnes-gold dark:hover:bg-ink-subtle"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            Lihat detail & foto {room.code}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="sh-panel space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#ECEFF4] pb-5 dark:border-ink-line">
          <div>
            <h1 className="text-xl font-bold tracking-[-0.02em] text-[#101828] dark:text-[#F5F7FA]">
              Booking ruang {room.code}
            </h1>
            <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
              {room.location_label} · Maks. {room.capacity} kursi
            </p>
          </div>
          <span className="rounded-lg border border-[#DCE2EC] bg-[#F4F6FA] px-3 py-1.5 tabular-nums text-xs font-semibold text-[#101828] dark:border-ink-line dark:bg-ink-subtle dark:text-unnes-gold">
            Kuota {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </span>
        </div>

        <div className="max-w-xs">
          <DatePickerPopover
            label="Tanggal pemakaian"
            days={days}
            value={dayIndex}
            onChange={(idx) => setDayIndex(idx)}
          />
        </div>

        {freeStartHours.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D5DCE8] p-6 text-center text-[13px] text-[#475467] dark:border-ink-line dark:text-[#B0B8C9]">
            Semua slot pada <strong className="text-[#101828] dark:text-[#F5F7FA]">{selectedDay.label}</strong> sudah
            terisi atau lewat. Pilih tanggal lain.
          </div>
        ) : (
          <>
            <div>
              <span className="mb-2 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Jam mulai</span>
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
                      className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'border-unnes-navy bg-unnes-navy text-white shadow-sm dark:border-unnes-gold dark:bg-unnes-gold dark:text-unnes-gold-ink'
                          : isFree
                            ? 'border-[#D8DDE7] bg-white text-[#101828] hover:border-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA] dark:hover:border-unnes-gold'
                            : 'cursor-not-allowed border-transparent bg-[#F1F3F7] text-[#98A2B3] line-through dark:bg-ink-canvas dark:text-[#4F5769]'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold tabular-nums">{formatHour(hour)}</div>
                      {!isFree && <div className="mt-0.5 text-[10px] no-underline">{SLOT_LABELS[status]}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Durasi</span>
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((d) => {
                  const allowed = d <= maxDuration;
                  const selected = duration === d && allowed;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setDuration(d)}
                      className={`rounded-xl border px-3 py-2.5 text-center transition-all duration-150 active:scale-95 ${
                        selected
                          ? 'border-unnes-navy bg-unnes-navy text-white shadow-sm dark:border-unnes-gold dark:bg-unnes-gold dark:text-unnes-gold-ink'
                          : allowed
                            ? 'border-[#D8DDE7] bg-white text-[#101828] hover:border-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA] dark:hover:border-unnes-gold'
                            : 'cursor-not-allowed border-transparent bg-[#F1F3F7] text-[#98A2B3] dark:bg-ink-canvas dark:text-[#4F5769]'
                      }`}
                    >
                      <div className="text-xs font-bold">{d} jam</div>
                      {allowed && (
                        <div className="font-mono text-[11px] tabular-nums opacity-85">
                          {formatHourRange(startHour, d)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ringkasan Jadwal & Tarif */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE2EC] bg-[#F6F8FB] px-4 py-3 text-[13px] dark:border-ink-line dark:bg-ink-subtle">
              <span className="font-medium text-[#475467] dark:text-[#D0D7E6]">
                {selectedDay.label} · <strong className="font-mono">{formatHourRange(startHour, duration)}</strong>
              </span>
              <span className="font-bold tabular-nums text-unnes-navy dark:text-unnes-gold">
                {pricePerHour > 0 ? formatRupiah(estimatedPrice) : 'Gratis Mahasiswa FEB'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Nama</span>
                <input type="text" value={user?.name || ''} readOnly className="sh-control opacity-75" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">NIM</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="8–12 digit angka"
                  className="sh-control font-mono tabular-nums"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Keperluan</span>
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
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                  Jumlah peserta
                </span>
                <input
                  type="number"
                  min={1}
                  max={room.capacity}
                  required
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder={`1–${room.capacity}`}
                  className="sh-control font-mono tabular-nums"
                />
              </label>
            </div>

            <BookingRulesPills />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-[#2E1C22] dark:text-rose-300"
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="sh-btn-primary w-full">
              <CalendarCheck2 className="h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Konfirmasi booking'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
