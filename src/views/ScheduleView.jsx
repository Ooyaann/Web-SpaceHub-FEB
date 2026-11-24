import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock, Plus, Search } from 'lucide-react';
import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

/**
 * Mengelompokkan slot berurutan untuk status terisi (k, o, m, p) menjadi blok horizontal berlabel,
 * sementara slot kosong (f) tetap per jam agar bisa diklik tepat di jam mulai yang diinginkan.
 */
function buildTimetableSegments({ roomCode, dateKey, weekday, bookings, reports, userEmail, todayWib, nowHourWib }) {
  const raw = OPERATIONAL_HOURS.map((hour) => {
    const status = getSlotStatus({
      roomCode,
      dateKey,
      weekday,
      hour,
      bookings,
      reports,
      userEmail,
      todayWib,
      nowHourWib,
    });
    const myBooking =
      status === 'm'
        ? bookings.find(
            (b) =>
              b.status === 'confirmed' &&
              b.room_code === roomCode &&
              b.booking_date === dateKey &&
              hour >= b.start_hour &&
              hour < b.start_hour + b.duration &&
              (b.user_email || '').toLowerCase() === (userEmail || '').toLowerCase()
          )
        : null;
    return { hour, status, bookingId: myBooking?.id || null };
  });

  const segments = [];
  let i = 0;
  while (i < raw.length) {
    const cur = raw[i];
    if (cur.status === 'f') {
      segments.push({ startHour: cur.hour, span: 1, status: 'f', bookingId: null });
      i += 1;
      continue;
    }
    let span = 1;
    while (
      i + span < raw.length &&
      raw[i + span].status === cur.status &&
      raw[i + span].bookingId === cur.bookingId
    ) {
      span += 1;
    }
    segments.push({ startHour: cur.hour, span, status: cur.status, bookingId: cur.bookingId });
    i += span;
  }

  // Hitung durasi kosong berurutan terpanjang & total jam kosong
  let maxConsecutiveFree = 0;
  let running = 0;
  let totalFree = 0;
  for (const s of raw) {
    if (s.status === 'f') {
      totalFree += 1;
      running += 1;
      if (running > maxConsecutiveFree) maxConsecutiveFree = running;
    } else {
      running = 0;
    }
  }

  return { segments, totalFree, maxConsecutiveFree };
}

const BLOCK_STYLES = {
  k: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] dark:border-[#2C529E] dark:bg-[#193061] dark:text-[#A9C7FF]',
  o: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] dark:border-[#784A12] dark:bg-[#3A250C] dark:text-[#FCD385]',
  m: 'border-unnes-gold bg-[#FEF9C3] text-[#713F12] dark:border-unnes-gold dark:bg-unnes-gold/25 dark:text-unnes-gold',
  p: 'border-line-light bg-surface-subtle text-[#8B9AB5] dark:border-unnes-night-line dark:bg-[#0D1628] dark:text-[#4D6085]',
};

export default function ScheduleView() {
  const {
    rooms,
    bookings,
    reports,
    user,
    isAdmin,
    days,
    nowWib,
    filters,
    updateFilter,
    openRoomDetail,
    openBookingForm,
  } = useSpaceHub();

  const [building, setBuilding] = useState('L4');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [minConsecutive, setMinConsecutive] = useState(0);
  const [query, setQuery] = useState('');

  const selectedDay = days[filters.day] || days[0];
  const isToday = selectedDay.key === nowWib.dateKey;

  const floorsInBuilding = useMemo(() => {
    const set = new Set(rooms.filter((r) => r.building === building).map((r) => r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms, building]);

  useEffect(() => {
    setFloorFilter('ALL');
  }, [building]);

  const floorOptions = useMemo(
    () => [
      { value: 'ALL', label: `Semua Lantai (${building})` },
      ...floorsInBuilding.map((fl) => ({ value: String(fl), label: `Lantai ${fl}` })),
    ],
    [building, floorsInBuilding]
  );

  const durationOptions = [
    { value: 0, label: 'Semua Ruang' },
    { value: 1, label: 'Min. 1 jam kosong' },
    { value: 2, label: 'Min. 2 jam berurutan' },
    { value: 3, label: 'Min. 3 jam berurutan' },
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms
      .filter((r) => {
        if (r.building !== building) return false;
        if (floorFilter !== 'ALL' && String(r.floor) !== floorFilter) return false;
        if (q && !r.code.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((r) => ({
        room: r,
        ...buildTimetableSegments({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        }),
      }))
      .filter((item) => item.maxConsecutiveFree >= minConsecutive);
  }, [rooms, building, floorFilter, query, minConsecutive, selectedDay, bookings, reports, user, nowWib]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Jadwal Ruang
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">
            Timetable 07.00–17.00 WIB · klik slot hijau untuk langsung booking di jam tersebut.
          </p>
        </div>

        <div className="w-56">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
            align="right"
          />
        </div>
      </div>

      {/* Unified Filter Bar */}
      <section className="sh-card space-y-3.5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Building Segmented */}
          <div className="lg:col-span-3">
            <div className="grid h-10 grid-cols-3 rounded-lg border border-line-light bg-surface-subtle p-1 dark:border-unnes-night-line dark:bg-unnes-night-input">
              {['L2', 'L4', 'L5'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBuilding(b)}
                  className={`rounded-md text-xs font-bold transition ${
                    building === b
                      ? 'bg-unnes-royal text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#4B5E82] hover:text-[#0F1B33] dark:text-unnes-night-muted dark:hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <SelectPopover
              icon={Building2}
              value={floorFilter}
              onChange={(v) => setFloorFilter(v)}
              options={floorOptions}
            />
          </div>

          <div className="lg:col-span-3">
            <SelectPopover
              icon={Clock}
              value={minConsecutive}
              onChange={(v) => setMinConsecutive(Number(v))}
              options={durationOptions}
            />
          </div>

          <div className="relative lg:col-span-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A7B9C]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter kode ruang..."
              className="sh-control pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-light pt-3 dark:border-unnes-night-line">
          <Legend compact />
          <span className="font-mono text-[11px] font-semibold text-[#526382] dark:text-unnes-night-muted">
            Menampilkan {rows.length} ruang · Gedung {building}
          </span>
        </div>
      </section>

      {/* Swiss Merged-Block Timetable */}
      <section className="sh-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Time Header */}
            <div className="grid grid-cols-[148px_1fr_82px] items-center gap-4 border-b border-line-light bg-surface-subtle/80 px-5 py-3 dark:border-unnes-night-line dark:bg-unnes-night-input">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526382] dark:text-unnes-night-muted">
                Ruang
              </span>
              <div className="grid grid-cols-10 gap-1.5 text-center">
                {OPERATIONAL_HOURS.map((h) => {
                  const isNowCol = isToday && h === nowWib.hour;
                  return (
                    <span
                      key={h}
                      className={`rounded py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                        isNowCol
                          ? 'bg-unnes-gold text-unnes-gold-ink'
                          : 'text-[#526382] dark:text-unnes-night-muted'
                      }`}
                    >
                      {pad2(h)}.00
                    </span>
                  );
                })}
              </div>
              <span className="text-right text-[11px] font-bold uppercase tracking-wider text-[#526382] dark:text-unnes-night-muted">
                Rentang
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs text-[#526382] dark:text-unnes-night-muted">
                Tidak ada ruang yang memenuhi kriteria durasi kosong ini.
              </div>
            ) : (
              <div className="divide-y divide-line-light dark:divide-unnes-night-line">
                {rows.map(({ room, segments, maxConsecutiveFree }) => (
                  <div
                    key={room.code}
                    className="grid grid-cols-[148px_1fr_82px] items-center gap-4 px-5 py-2.5 transition hover:bg-surface-subtle/40 dark:hover:bg-[#15223D]/70"
                  >
                    {/* Room Meta */}
                    <button
                      type="button"
                      onClick={() => openRoomDetail(room.code, filters.day)}
                      className="min-w-0 text-left"
                    >
                      <div className="truncate font-mono text-xs font-bold text-[#0F1B33] hover:text-unnes-royal dark:text-[#F1F5FB] dark:hover:text-unnes-gold">
                        {room.code}
                      </div>
                      <div className="text-[11px] text-[#6A7B9C] dark:text-unnes-night-muted">
                        Lt. {room.floor} · {room.capacity} kursi
                      </div>
                    </button>

                    {/* 10-Column Merged Blocks */}
                    <div className="grid grid-cols-10 gap-1.5">
                      {segments.map((seg) => {
                        if (seg.status === 'f') {
                          const canBook = !isAdmin && seg.startHour <= 15;
                          return canBook ? (
                            <button
                              key={seg.startHour}
                              type="button"
                              onClick={() => openBookingForm(room.code, filters.day, seg.startHour)}
                              title={`Booking ${room.code} mulai ${formatHour(seg.startHour)}`}
                              className="group/slot flex h-8 items-center justify-center rounded-md border border-emerald-300/90 bg-emerald-50 text-emerald-700 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-[#07150E]"
                            >
                              <Plus className="h-3.5 w-3.5 opacity-45 transition group-hover/slot:opacity-100" />
                            </button>
                          ) : (
                            <div
                              key={seg.startHour}
                              title={`${formatHour(seg.startHour)} · Kosong`}
                              className="h-8 rounded-md border border-emerald-300/80 bg-emerald-50 dark:border-emerald-500/35 dark:bg-emerald-500/15"
                            />
                          );
                        }

                        const label =
                          seg.status === 'k'
                            ? seg.span >= 2
                              ? `Kuliah · ${seg.span}j`
                              : 'Kuliah'
                            : seg.status === 'm'
                              ? seg.span >= 2 && seg.bookingId
                                ? `${seg.bookingId}`
                                : 'Milikmu'
                              : seg.status === 'o'
                                ? seg.span >= 2
                                  ? `Terpakai · ${seg.span}j`
                                  : 'Isi'
                                : 'Lewat';

                        return (
                          <div
                            key={seg.startHour}
                            style={{ gridColumn: `span ${seg.span} / span ${seg.span}` }}
                            title={`${formatHour(seg.startHour)}–${formatHour(seg.startHour + seg.span)} · ${SLOT_LABELS[seg.status]}`}
                            className={`flex h-8 items-center justify-center truncate rounded-md border px-1.5 text-[10px] font-bold tracking-tight ${BLOCK_STYLES[seg.status]}`}
                          >
                            <span className="truncate">{label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Longest Free Stretch Badge */}
                    <div className="text-right">
                      {maxConsecutiveFree > 0 ? (
                        <span className="inline-block rounded-md bg-emerald-50 px-2 py-1 font-mono text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Maks {Math.min(3, maxConsecutiveFree)}j
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-surface-subtle px-2 py-1 font-mono text-[11px] font-semibold text-[#8B9AB5] dark:bg-unnes-night-input dark:text-[#55678B]">
                          Penuh
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
