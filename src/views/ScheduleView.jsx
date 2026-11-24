import { useEffect, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotDetail } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

function buildTimetableSegments({ roomCode, dateKey, weekday, bookings, reports, userEmail, todayWib, nowHourWib }) {
  const raw = OPERATIONAL_HOURS.map((hour) => {
    const isPast = dateKey === todayWib && hour < nowHourWib;
    if (isPast) {
      return { hour, status: 'p', groupKey: 'past', detailLabel: 'Lewat' };
    }
    const detail = getSlotDetail({
      roomCode,
      dateKey,
      weekday,
      hour,
      bookings,
      reports,
      userEmail,
    });
    if (detail.status === 'm' && detail.booking) {
      return {
        hour,
        status: 'm',
        groupKey: `m:${detail.booking.id}`,
        detailLabel: detail.booking.id,
        tooltipExtra: `${detail.booking.id} · ${detail.booking.purpose}`,
      };
    }
    if (detail.status === 'o' && detail.booking) {
      return {
        hour,
        status: 'o',
        groupKey: `o:${detail.booking.id}`,
        detailLabel: detail.booking.user_name,
        tooltipExtra: `${detail.booking.user_name} · ${detail.booking.purpose}`,
      };
    }
    if (detail.status === 'o' && detail.report) {
      return {
        hour,
        status: 'o',
        groupKey: `rep:${detail.report.id}`,
        detailLabel: 'Dilaporkan',
        tooltipExtra: `Dilaporkan dipakai (${detail.report.reported_by})`,
      };
    }
    return {
      hour,
      status: detail.status,
      groupKey: detail.status,
      detailLabel: detail.status === 'k' ? 'Kuliah' : 'Kosong',
      tooltipExtra: '',
    };
  });

  const segments = [];
  let i = 0;
  while (i < raw.length) {
    const cur = raw[i];
    if (cur.status === 'f') {
      segments.push({ startHour: cur.hour, span: 1, status: 'f', detailLabel: 'Kosong', tooltipExtra: '' });
      i += 1;
      continue;
    }
    let span = 1;
    while (
      i + span < raw.length &&
      raw[i + span].status === cur.status &&
      raw[i + span].groupKey === cur.groupKey
    ) {
      span += 1;
    }
    segments.push({
      startHour: cur.hour,
      span,
      status: cur.status,
      detailLabel: cur.detailLabel,
      tooltipExtra: cur.tooltipExtra,
    });
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

const BLOCK_STYLES = {
  k: 'border border-[#93C5FD] bg-[#DBEAFE] text-[#1E40AF] dark:border-[#60A5FA]/40 dark:bg-[#1E3A8A]/80 dark:text-[#DBEAFE]',
  o: 'border border-[#FDBA74] bg-[#FFEDD5] text-[#9A3412] dark:border-[#FB923C]/45 dark:bg-[#7C2D12]/85 dark:text-[#FFEDD5]',
  m: 'border border-[#D99B00] bg-unnes-gold font-bold text-unnes-gold-ink shadow-sm',
  p: 'border border-[#E2E6EE] bg-[#F1F3F7] text-[#98A2B3] dark:border-ink-line/60 dark:bg-[#181B22] dark:text-[#586175]',
};

const BLOCK_ICONS = {
  k: GraduationCap,
  o: Users,
  m: CheckCircle2,
  p: Clock,
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
    schedPrefs,
    setSchedPrefs,
    openRoomDetail,
    openBookingForm,
  } = useSpaceHub();

  const { building, floorFilter, minConsecutive, query } = schedPrefs;

  const selectedDay = days[filters.day] || days[0];
  const isToday = selectedDay.key === nowWib.dateKey;

  const floorsInBuilding = useMemo(() => {
    const set = new Set(rooms.filter((r) => r.building === building).map((r) => r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms, building]);

  useEffect(() => {
    if (floorFilter !== 'ALL' && !floorsInBuilding.includes(Number(floorFilter))) {
      setSchedPrefs((prev) => ({ ...prev, floorFilter: 'ALL' }));
    }
  }, [building, floorFilter, floorsInBuilding, setSchedPrefs]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">
            Jadwal ruang
          </h1>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Klik kotak hijau <strong className="font-semibold text-[#166534] dark:text-[#4ADE80]">+</strong> untuk
            langsung booking, atau klik kode ruang untuk melihat foto & detail.
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

      {/* Controls Panel */}
      <div className="sh-panel space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="grid h-10 grid-cols-3 rounded-xl border border-[#DCE2EC] bg-[#F2F4F8] p-1 dark:border-ink-line dark:bg-ink-canvas">
              {['L2', 'L4', 'L5'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSchedPrefs((prev) => ({ ...prev, building: b, floorFilter: 'ALL' }))}
                  className={`rounded-lg text-xs font-semibold transition-all ${
                    building === b
                      ? 'bg-unnes-navy text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#475467] hover:text-[#101828] dark:text-[#B0B8C9] dark:hover:text-[#F5F7FA]'
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
              onChange={(v) => setSchedPrefs((prev) => ({ ...prev, floorFilter: v }))}
              options={floorOptions}
            />
          </div>

          <div className="lg:col-span-3">
            <SelectPopover
              icon={Clock}
              value={minConsecutive}
              onChange={(v) => setSchedPrefs((prev) => ({ ...prev, minConsecutive: Number(v) }))}
              options={durationOptions}
            />
          </div>

          <div className="relative lg:col-span-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setSchedPrefs((prev) => ({ ...prev, query: e.target.value }))}
              placeholder="Filter kode ruang..."
              className="sh-control pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFF4] pt-3 dark:border-ink-line">
          <Legend compact />
          <span className="text-xs font-medium text-[#667085] dark:text-[#8A93A6]">
            {rows.length} ruang ditampilkan · Gedung {building}
          </span>
        </div>
      </div>

      {/* Timetable Grid Panel */}
      <div className="sh-panel overflow-hidden">
        <div className="overflow-x-auto p-4 sm:p-5">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[152px_1fr_84px] items-center gap-4 border-b border-[#E4E7EE] pb-3 dark:border-ink-line">
              <span className="text-xs font-semibold text-[#475467] dark:text-[#B0B8C9]">Ruang</span>
              <div className="grid grid-cols-10 gap-1.5 text-center">
                {OPERATIONAL_HOURS.map((h) => {
                  const isNowCol = isToday && h === nowWib.hour;
                  return (
                    <span
                      key={h}
                      className={`rounded-md py-1 text-xs font-semibold tabular-nums ${
                        isNowCol
                          ? 'bg-unnes-gold text-unnes-gold-ink'
                          : 'text-[#667085] dark:text-[#8A93A6]'
                      }`}
                    >
                      {pad2(h)}.00
                    </span>
                  );
                })}
              </div>
              <span className="text-right text-xs font-semibold text-[#475467] dark:text-[#B0B8C9]">Bisa pakai</span>
            </div>

            {rows.length === 0 ? (
              <div className="py-14 text-center text-[13px] text-[#475467] dark:text-[#B0B8C9]">
                Tidak ada ruang yang cocok dengan kriteria durasi kosong ini.
              </div>
            ) : (
              <div className="divide-y divide-[#ECEFF4] dark:divide-ink-line/70">
                {rows.map(({ room, segments, maxConsecutiveFree }) => (
                  <div
                    key={room.code}
                    className="grid grid-cols-[152px_1fr_84px] items-center gap-4 py-3 transition-colors hover:bg-[#F8F9FC] dark:hover:bg-ink-subtle/35"
                  >
                    <button
                      type="button"
                      onClick={() => openRoomDetail(room.code, filters.day)}
                      className="group min-w-0 text-left"
                    >
                      <div className="truncate text-[13px] font-bold text-[#101828] transition-colors group-hover:text-unnes-navy dark:text-[#F5F7FA] dark:group-hover:text-unnes-gold">
                        {room.code}
                      </div>
                      <div className="text-xs text-[#667085] dark:text-[#8A93A6]">
                        Lt. {room.floor} · {room.capacity} kursi
                      </div>
                    </button>

                    <div className="grid grid-cols-10 gap-1.5">
                      {segments.map((seg) => {
                        if (seg.status === 'f') {
                          const canBook = !isAdmin && seg.startHour <= 16;
                          return canBook ? (
                            <button
                              key={seg.startHour}
                              type="button"
                              onClick={() => openBookingForm(room.code, filters.day, seg.startHour)}
                              title={`Booking ${room.code} mulai ${formatHour(seg.startHour)}`}
                              className="group/slot flex h-9 items-center justify-center rounded-lg border border-[#86EFAC] bg-[#DCFCE7] text-[#166534] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#16A34A] hover:bg-[#16A34A] hover:text-white active:scale-95 dark:border-[#22C55E]/45 dark:bg-[#14532D] dark:text-[#ECFDF5] dark:hover:border-[#22C55E] dark:hover:bg-[#22C55E] dark:hover:text-[#052E16]"
                            >
                              <Plus className="h-4 w-4 stroke-[2.5] transition-transform duration-150 group-hover/slot:scale-110" />
                            </button>
                          ) : (
                            <div
                              key={seg.startHour}
                              title={`${formatHour(seg.startHour)} · Kosong`}
                              className="flex h-9 items-center justify-center rounded-lg border border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/45 dark:bg-[#14532D] dark:text-[#ECFDF5]"
                            >
                              <Plus className="h-3.5 w-3.5 opacity-60" />
                            </div>
                          );
                        }

                        const Icon = BLOCK_ICONS[seg.status];
                        const label =
                          seg.status === 'k'
                            ? seg.span >= 2
                              ? `Kuliah · ${seg.span}j`
                              : ''
                            : seg.status === 'm'
                              ? seg.span >= 2
                                ? `${seg.detailLabel} · Milikmu`
                                : 'Milikmu'
                              : seg.status === 'o'
                                ? seg.span >= 2
                                  ? seg.detailLabel
                                  : 'Isi'
                                : seg.span >= 2
                                  ? 'Lewat'
                                  : '';

                        return (
                          <div
                            key={seg.startHour}
                            style={{ gridColumn: `span ${seg.span} / span ${seg.span}` }}
                            title={`${formatHour(seg.startHour)}–${formatHour(seg.startHour + seg.span)} · ${SLOT_LABELS[seg.status]}${
                              seg.tooltipExtra ? ` (${seg.tooltipExtra})` : ''
                            }`}
                            className={`flex h-9 items-center justify-center gap-1.5 truncate rounded-lg px-2 text-[11px] font-semibold ${BLOCK_STYLES[seg.status]}`}
                          >
                            <Icon className="h-3.5 w-3.5 flex-none" />
                            {label && <span className="truncate">{label}</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-right text-xs font-semibold tabular-nums">
                      {maxConsecutiveFree > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#86EFAC] bg-[#DCFCE7] px-2 py-1 text-[#166534] dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5]">
                          Maks {Math.min(3, maxConsecutiveFree)}j
                        </span>
                      ) : (
                        <span className="text-[#98A2B3] dark:text-[#667085]">Penuh</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
