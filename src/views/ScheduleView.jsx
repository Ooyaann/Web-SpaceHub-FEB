import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock, Plus, Search } from 'lucide-react';
import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

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

  let maxConsecutiveFree = 0;
  let running = 0;
  for (const s of raw) {
    if (s.status === 'f') {
      running += 1;
      if (running > maxConsecutiveFree) maxConsecutiveFree = running;
    } else {
      running = 0;
    }
  }

  return { segments, maxConsecutiveFree };
}

/* Solid, calm, opaque block styles — ZERO glowing neon borders */
const BLOCK_STYLES = {
  k: 'bg-[#E9F0FC] text-[#1E40AF] dark:bg-[#22304D] dark:text-[#A9C2F5]',
  o: 'bg-[#FBEEDB] text-[#9A3412] dark:bg-[#382C1E] dark:text-[#F6C48B]',
  m: 'bg-[#FDEBA3] text-[#713F12] dark:bg-[#4A3D19] dark:text-unnes-gold',
  p: 'bg-[#F2F4F7] text-[#98A2B3] dark:bg-[#1A202D] dark:text-[#5B6780]',
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
      { value: 'ALL', label: `Semua lantai (${building})` },
      ...floorsInBuilding.map((fl) => ({ value: String(fl), label: `Lantai ${fl}` })),
    ],
    [building, floorsInBuilding]
  );

  const durationOptions = [
    { value: 0, label: 'Semua ruang' },
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
    <div className="space-y-7">
      {/* Header + Controls on clean canvas */}
      <div className="space-y-5 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
              Jadwal ruang
            </h1>
            <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
              Klik kotak hijau (+) untuk langsung booking di jam tersebut.
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="grid h-10 grid-cols-3 rounded-lg bg-[#F1F3F7] p-1 dark:bg-ink-card">
              {['L2', 'L4', 'L5'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBuilding(b)}
                  className={`rounded-md text-xs font-semibold transition ${
                    building === b
                      ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]'
                  }`}
                >
                  Gedung {b}
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B869B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter kode ruang..."
              className="sh-control pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Legend compact />
          <span className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">
            {rows.length} ruang · Gedung {building}
          </span>
        </div>
      </div>

      {/* Clean Solid Timetable */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[148px_1fr_76px] items-center gap-4 border-b border-[#E6E9F0] pb-3 dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-[#5B667B] dark:text-[#9AA7BE]">Ruang</span>
            <div className="grid grid-cols-10 gap-1.5 text-center">
              {OPERATIONAL_HOURS.map((h) => {
                const isNowCol = isToday && h === nowWib.hour;
                return (
                  <span
                    key={h}
                    className={`rounded py-0.5 text-xs font-semibold tabular-nums ${
                      isNowCol
                        ? 'bg-unnes-gold text-unnes-gold-ink'
                        : 'text-[#6B768C] dark:text-[#8E9BB3]'
                    }`}
                  >
                    {pad2(h)}.00
                  </span>
                );
              })}
            </div>
            <span className="text-right text-xs font-semibold text-[#5B667B] dark:text-[#9AA7BE]">Kosong</span>
          </div>

          {rows.length === 0 ? (
            <div className="py-14 text-center text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
              Tidak ada ruang yang cocok dengan kriteria durasi kosong ini.
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0F4] dark:divide-white/[0.06]">
              {rows.map(({ room, segments, maxConsecutiveFree }) => (
                <div
                  key={room.code}
                  className="grid grid-cols-[148px_1fr_76px] items-center gap-4 py-3 transition hover:bg-[#F9FAFC] dark:hover:bg-ink-card/50"
                >
                  <button
                    type="button"
                    onClick={() => openRoomDetail(room.code, filters.day)}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate text-[13px] font-bold text-[#141923] hover:text-unnes-navy dark:text-[#EEF2F7] dark:hover:text-unnes-gold">
                      {room.code}
                    </div>
                    <div className="text-xs text-[#7B869B] dark:text-[#8693AA]">
                      Lt. {room.floor} · {room.capacity} kursi
                    </div>
                  </button>

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
                            className="group/slot flex h-8 items-center justify-center rounded-md bg-[#E4F5EC] text-[#18794E] transition hover:bg-[#22A06B] hover:text-white dark:bg-[#1D362D] dark:text-[#6EE7B7] dark:hover:bg-[#22A06B] dark:hover:text-white"
                          >
                            <Plus className="h-3.5 w-3.5 opacity-50 transition group-hover/slot:opacity-100" />
                          </button>
                        ) : (
                          <div
                            key={seg.startHour}
                            title={`${formatHour(seg.startHour)} · Kosong`}
                            className="h-8 rounded-md bg-[#E4F5EC] dark:bg-[#1D362D]"
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
                              ? seg.bookingId
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
                          className={`flex h-8 items-center justify-center truncate rounded-md px-2 text-[11px] font-semibold ${BLOCK_STYLES[seg.status]}`}
                        >
                          <span className="truncate">{label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-right text-xs font-semibold tabular-nums">
                    {maxConsecutiveFree > 0 ? (
                      <span className="text-[#18794E] dark:text-[#6EE7B7]">
                        Maks {Math.min(3, maxConsecutiveFree)}j
                      </span>
                    ) : (
                      <span className="text-[#98A2B3] dark:text-[#637089]">Penuh</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
