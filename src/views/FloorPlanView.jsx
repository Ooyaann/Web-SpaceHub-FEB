import { useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DoorOpen,
  GraduationCap,
  Plus,
  Users,
} from 'lucide-react';
import { SLOT_LABELS, START_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour, getSlotDetail } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

const TILE_ACCENTS = {
  f: 'border-[#C6DFD1] border-l-[4px] border-l-[#16A34A] bg-white shadow-card hover:-translate-y-0.5 hover:shadow-card-hover dark:border-ink-line dark:border-l-[#22C55E] dark:bg-ink-card dark:hover:border-ink-line-strong dark:hover:border-l-[#22C55E]',
  m: 'border-unnes-gold/65 border-l-[4px] border-l-unnes-gold bg-white shadow-card hover:-translate-y-0.5 dark:border-unnes-gold/45 dark:border-l-unnes-gold dark:bg-ink-card',
  o: 'border-[#F7D0A2] border-l-[4px] border-l-[#F59E0B] bg-white hover:-translate-y-0.5 dark:border-ink-line dark:border-l-[#FB923C] dark:bg-ink-card',
  k: 'border-[#C9DAF8] border-l-[4px] border-l-[#3B82F6] bg-[#F8FAFE] hover:-translate-y-0.5 dark:border-ink-line dark:border-l-[#60A5FA] dark:bg-[#1A1E28]',
  p: 'border-[#E6E9EF] border-l-[4px] border-l-[#CBD5E1] bg-[#F2F4F7] opacity-75 dark:border-ink-line/60 dark:border-l-[#475467] dark:bg-[#15181F]',
};

const BADGE_META = {
  f: {
    icon: Plus,
    className:
      'border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/45 dark:bg-[#14532D] dark:text-[#ECFDF5]',
  },
  k: {
    icon: GraduationCap,
    className:
      'border-[#93C5FD] bg-[#DBEAFE] text-[#1E40AF] dark:border-[#60A5FA]/40 dark:bg-[#1E3A8A]/80 dark:text-[#DBEAFE]',
  },
  o: {
    icon: Users,
    className:
      'border-[#FDBA74] bg-[#FFEDD5] text-[#9A3412] dark:border-[#FB923C]/45 dark:bg-[#7C2D12]/85 dark:text-[#FFEDD5]',
  },
  m: {
    icon: CheckCircle2,
    className: 'border-[#D99B00] bg-unnes-gold font-bold text-unnes-gold-ink',
  },
  p: {
    icon: Clock,
    className:
      'border-[#DCE2EC] bg-[#EAEEF4] text-[#667085] dark:border-ink-line dark:bg-[#1E222B] dark:text-[#8A93A6]',
  },
};

export default function FloorPlanView() {
  const {
    rooms,
    bookings,
    reports,
    user,
    days,
    nowWib,
    filters,
    updateFilter,
    planPrefs,
    setPlanPrefs,
    openRoomDetail,
  } = useSpaceHub();

  const buildings = useMemo(() => {
    const map = new Map();
    for (const r of rooms) {
      if (!map.has(r.building)) map.set(r.building, new Set());
      map.get(r.building).add(r.floor);
    }
    return Array.from(map.entries()).map(([b, floorsSet]) => ({
      building: b,
      floors: Array.from(floorsSet).sort((a, c) => a - c),
    }));
  }, [rooms]);

  const selectedBuilding = planPrefs.building || buildings[1]?.building || buildings[0]?.building || 'L4';
  const activeBuildingObj = buildings.find((b) => b.building === selectedBuilding) || buildings[0];
  const selectedFloor = planPrefs.floor ?? activeBuildingObj?.floors[0] ?? 2;

  useEffect(() => {
    if (activeBuildingObj && !activeBuildingObj.floors.includes(selectedFloor)) {
      setPlanPrefs((prev) => ({ ...prev, floor: activeBuildingObj.floors[0] }));
    }
  }, [activeBuildingObj, selectedFloor, setPlanPrefs]);

  const selectedDay = days[filters.day] || days[0];
  const hourOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  const floorCounts = useMemo(() => {
    const res = new Map();
    const isPastHour = selectedDay.key === nowWib.dateKey && filters.start < nowWib.hour;
    for (const fl of activeBuildingObj?.floors || []) {
      const list = rooms.filter((r) => r.building === selectedBuilding && r.floor === fl);
      const free = isPastHour
        ? 0
        : list.filter(
            (r) =>
              getSlotDetail({
                roomCode: r.code,
                dateKey: selectedDay.key,
                weekday: selectedDay.weekday,
                hour: filters.start,
                bookings,
                reports,
                userEmail: user?.email,
              }).status === 'f'
          ).length;
      res.set(fl, { free, total: list.length });
    }
    return res;
  }, [activeBuildingObj, rooms, selectedBuilding, selectedDay, filters.start, bookings, reports, user, nowWib]);

  const floorRooms = useMemo(() => {
    const isPastHour = selectedDay.key === nowWib.dateKey && filters.start < nowWib.hour;
    return rooms
      .filter((r) => r.building === selectedBuilding && r.floor === selectedFloor)
      .map((r) => {
        const detail = getSlotDetail({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          hour: filters.start,
          bookings,
          reports,
          userEmail: user?.email,
        });
        const status = isPastHour ? 'p' : detail.status;
        const freeUntil = getFreeUntilHour({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        });
        return { ...r, status, detail, freeUntil };
      });
  }, [rooms, selectedBuilding, selectedFloor, selectedDay, filters.start, bookings, reports, user, nowWib]);

  const summary = useMemo(() => {
    let free = 0;
    let kuliah = 0;
    let used = 0;
    for (const r of floorRooms) {
      if (r.status === 'f') free += 1;
      else if (r.status === 'k') kuliah += 1;
      else if (r.status === 'o' || r.status === 'm') used += 1;
    }
    return { free, kuliah, used };
  }, [floorRooms]);

  const half = Math.ceil(floorRooms.length / 2);
  const northWing = floorRooms.slice(0, half);
  const southWing = floorRooms.slice(half);

  const renderWing = (list, wingLabel) => (
    <div>
      <div className="mb-2 text-xs font-semibold text-[#667085] dark:text-[#8A93A6]">{wingLabel}</div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4">
        {list.map((r) => {
          const isLab = Number(r.price_per_hour) > 0 || r.code.includes('Lab');
          const badge = BADGE_META[r.status];
          const StatusIcon = badge.icon;

          const statusText =
            r.status === 'f'
              ? `s.d. ${formatHour(r.freeUntil)}`
              : r.status === 'm' && r.detail.booking
                ? r.detail.booking.id
                : r.status === 'o' && r.detail.booking
                  ? r.detail.booking.user_name
                  : r.status === 'o' && r.detail.report
                    ? 'Dilaporkan'
                    : SLOT_LABELS[r.status];

          return (
            <button
              key={r.code}
              type="button"
              title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
              onClick={() => openRoomDetail(r.code, filters.day)}
              className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.99] sm:p-4 ${TILE_ACCENTS[r.status]}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-sm font-bold tracking-tight text-[#101828] sm:text-[15px] dark:text-[#F5F7FA]">
                    {r.code}
                  </span>

                  {isLab ? (
                    <span className="rounded-md border border-[#FDE68A] bg-[#FEF8E6] px-1.5 py-0.5 text-[10px] font-semibold text-[#92400E] dark:border-unnes-gold/35 dark:bg-[#2F2817] dark:text-unnes-gold">
                      Lab
                    </span>
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 flex-none text-[#98A2B3] opacity-60 transition-all group-hover:opacity-100 sm:opacity-0 dark:text-[#8A93A6]" />
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-[#667085] sm:text-xs dark:text-[#B0B8C9]">
                  {r.capacity} kursi
                </div>
              </div>

              <div className="mt-3">
                <span
                  className={`inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold sm:text-[11px] ${badge.className}`}
                >
                  <StatusIcon className="h-3 w-3 flex-none stroke-[2.25]" />
                  <span className="truncate">
                    {r.status === 'f' ? `Kosong ${statusText}` : statusText}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
            Denah lantai
          </h1>
          <p className="mt-0.5 text-xs text-[#475467] sm:mt-1 sm:text-[13px] dark:text-[#B0B8C9]">
            Ketuk ruang untuk melihat foto, tarif, dan booking.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5 sm:max-w-sm sm:gap-3">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
          />
          <SelectPopover
            label="Jam cek"
            icon={Clock}
            value={filters.start}
            onChange={(v) => updateFilter('start', Number(v))}
            options={hourOptions}
            align="right"
          />
        </div>
      </div>

      {/* Selector Panel — Rapi di Smartphone */}
      <div className="sh-panel space-y-3 p-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:p-4">
        <div className="space-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0">
          <div className="grid grid-cols-3 rounded-xl border border-[#DCE2EC] bg-[#F2F4F8] p-1 sm:inline-flex dark:border-ink-line dark:bg-ink-canvas">
            {buildings.map(({ building }) => (
              <button
                key={building}
                type="button"
                onClick={() => setPlanPrefs((prev) => ({ ...prev, building }))}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 sm:py-1.5 ${
                  building === selectedBuilding
                    ? 'bg-unnes-navy text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                    : 'text-[#475467] hover:text-[#101828] dark:text-[#B0B8C9] dark:hover:text-[#F5F7FA]'
                }`}
              >
                Gedung {building}
              </button>
            ))}
          </div>

          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 sm:flex-wrap">
            {(activeBuildingObj?.floors || []).map((fl) => {
              const count = floorCounts.get(fl) || { free: 0, total: 0 };
              const active = fl === selectedFloor;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setPlanPrefs((prev) => ({ ...prev, floor: fl }))}
                  className={`sh-chip flex-none ${active ? 'sh-chip-active' : ''}`}
                >
                  <span>Lantai {fl}</span>
                  <span className="tabular-nums opacity-80">
                    ({count.free}/{count.total})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#ECEFF4] pt-2.5 text-xs font-medium text-[#475467] sm:border-0 sm:pt-0 sm:gap-4 dark:border-ink-line dark:text-[#B0B8C9]">
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.free}</strong> kosong
          </span>
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.kuliah}</strong>{' '}
            kuliah
          </span>
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.used}</strong>{' '}
            terpakai
          </span>
        </div>
      </div>

      {/* Architectural Floor Map */}
      <section className="sh-panel space-y-5 p-3.5 sm:space-y-6 sm:p-6">
        <div className="space-y-2 border-b border-[#ECEFF4] pb-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:space-y-0 sm:pb-4 dark:border-ink-line">
          <h2 className="text-[15px] font-bold text-[#101828] sm:text-base dark:text-[#F5F7FA]">
            Gedung {selectedBuilding} · Lantai {selectedFloor}
          </h2>
          <Legend compact />
        </div>

        {renderWing(northWing, 'Sayap utara')}

        <div className="flex items-center justify-between rounded-xl border border-dashed border-[#D5DCE8] bg-[#F5F7FA] px-3 py-2.5 text-[11px] font-medium text-[#667085] sm:px-4 sm:py-3 sm:text-xs dark:border-ink-line dark:bg-ink-canvas dark:text-[#8A93A6]">
          <span className="inline-flex items-center gap-1">
            <DoorOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tangga barat</span>
            <span className="sm:hidden">Barat</span>
          </span>
          <span className="font-semibold">Koridor lantai {selectedFloor}</span>
          <span className="inline-flex items-center gap-1">
            <span className="hidden sm:inline">Tangga timur</span>
            <span className="sm:hidden">Timur</span>
            <DoorOpen className="h-3.5 w-3.5" />
          </span>
        </div>

        {southWing.length > 0 && renderWing(southWing, 'Sayap selatan')}
      </section>
    </div>
  );
}
