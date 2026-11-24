import { useEffect, useMemo, useState } from 'react';
import { Clock, DoorOpen, Users } from 'lucide-react';
import { SLOT_LABELS, START_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

const TILE_STYLES = {
  f: 'border-emerald-300 bg-emerald-50/75 hover:border-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/12 dark:hover:border-emerald-400',
  k: 'border-[#BFDBFE] bg-[#EFF6FF]/75 hover:border-[#3B82F6] dark:border-[#2C529E] dark:bg-[#193061]/60 dark:hover:border-[#5B8EFF]',
  o: 'border-[#FDE68A] bg-[#FFFBEB]/80 hover:border-amber-500 dark:border-[#784A12] dark:bg-[#3A250C]/60 dark:hover:border-amber-400',
  m: 'border-unnes-gold bg-[#FEF9C3]/80 hover:border-unnes-gold-hover dark:border-unnes-gold/70 dark:bg-unnes-gold/15',
  p: 'border-line-light bg-surface-subtle/60 opacity-65 dark:border-unnes-night-line dark:bg-unnes-night-input/60',
};

const BADGE_STYLES = {
  f: 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-[#07150E]',
  k: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#25458A] dark:text-[#BBD3FF]',
  o: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#663E0E] dark:text-[#FCD385]',
  m: 'bg-unnes-gold text-unnes-gold-ink',
  p: 'bg-slate-200 text-slate-500 dark:bg-[#1B2B4B] dark:text-[#6E82AA]',
};

export default function FloorPlanView() {
  const { rooms, bookings, reports, user, days, nowWib, filters, updateFilter, openRoomDetail } =
    useSpaceHub();

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

  const [selectedBuilding, setSelectedBuilding] = useState(buildings[1]?.building || buildings[0]?.building || 'L4');
  const activeBuildingObj = buildings.find((b) => b.building === selectedBuilding) || buildings[0];
  const [selectedFloor, setSelectedFloor] = useState(activeBuildingObj?.floors[0] ?? 2);

  useEffect(() => {
    if (activeBuildingObj && !activeBuildingObj.floors.includes(selectedFloor)) {
      setSelectedFloor(activeBuildingObj.floors[0]);
    }
  }, [activeBuildingObj, selectedFloor]);

  const selectedDay = days[filters.day] || days[0];
  const hourOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  const floorCounts = useMemo(() => {
    const res = new Map();
    for (const fl of activeBuildingObj?.floors || []) {
      const list = rooms.filter((r) => r.building === selectedBuilding && r.floor === fl);
      const free = list.filter(
        (r) =>
          getSlotStatus({
            roomCode: r.code,
            dateKey: selectedDay.key,
            weekday: selectedDay.weekday,
            hour: filters.start,
            bookings,
            reports,
            userEmail: user?.email,
            todayWib: nowWib.dateKey,
            nowHourWib: nowWib.hour,
          }) === 'f'
      ).length;
      res.set(fl, { free, total: list.length });
    }
    return res;
  }, [activeBuildingObj, rooms, selectedBuilding, selectedDay, filters.start, bookings, reports, user, nowWib]);

  const floorRooms = useMemo(
    () =>
      rooms
        .filter((r) => r.building === selectedBuilding && r.floor === selectedFloor)
        .map((r) => {
          const status = getSlotStatus({
            roomCode: r.code,
            dateKey: selectedDay.key,
            weekday: selectedDay.weekday,
            hour: filters.start,
            bookings,
            reports,
            userEmail: user?.email,
            todayWib: nowWib.dateKey,
            nowHourWib: nowWib.hour,
          });
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
          return { ...r, status, freeUntil };
        }),
    [rooms, selectedBuilding, selectedFloor, selectedDay, filters.start, bookings, reports, user, nowWib]
  );

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
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#6A7B9C] dark:text-[#6E82AA]">
        {wingLabel}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const isLab = r.code.includes('Lab');
          return (
            <button
              key={r.code}
              type="button"
              title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
              onClick={() => openRoomDetail(r.code, filters.day)}
              className={`group flex flex-col justify-between rounded-lg border p-3.5 text-left transition ${TILE_STYLES[r.status]}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-sm font-bold text-[#0F1B33] dark:text-[#F1F5FB]">{r.code}</span>
                  {isLab && (
                    <span className="rounded bg-unnes-navy/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-unnes-navy dark:bg-unnes-gold/20 dark:text-unnes-gold">
                      LAB
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#526382] dark:text-unnes-night-muted">
                  <Users className="h-3 w-3" />
                  {r.capacity} kursi
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-1">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLES[r.status]}`}>
                  {r.status === 'f' ? `Kosong s.d. ${formatHour(r.freeUntil)}` : SLOT_LABELS[r.status]}
                </span>
                <span className="text-[10px] font-semibold text-[#526382] opacity-0 transition group-hover:opacity-100 dark:text-unnes-night-muted">
                  Detail →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Denah Lantai
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">
            Posisi dan status ruang tiap lantai · klik ruang untuk detail & booking.
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
          />
          <SelectPopover
            label="Jam"
            icon={Clock}
            value={filters.start}
            onChange={(v) => updateFilter('start', Number(v))}
            options={hourOptions}
            align="right"
          />
        </div>
      </div>

      {/* 2-Level Building -> Floor Selector */}
      <div className="sh-card space-y-3.5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-line-light bg-surface-subtle p-1 dark:border-unnes-night-line dark:bg-unnes-night-input">
            {buildings.map(({ building }) => {
              const active = building === selectedBuilding;
              return (
                <button
                  key={building}
                  type="button"
                  onClick={() => setSelectedBuilding(building)}
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-unnes-royal text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#4B5E82] hover:text-[#0F1B33] dark:text-unnes-night-muted dark:hover:text-white'
                  }`}
                >
                  Gedung {building}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400">{summary.free} Kosong</span>
            <span className="text-[#CBD5E1] dark:text-unnes-night-line">·</span>
            <span className="text-[#1D4ED8] dark:text-[#79A6FF]">{summary.kuliah} Kuliah</span>
            <span className="text-[#CBD5E1] dark:text-unnes-night-line">·</span>
            <span className="text-amber-700 dark:text-amber-400">{summary.used} Dibooking</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-line-light pt-3 dark:border-unnes-night-line">
          {(activeBuildingObj?.floors || []).map((fl) => {
            const count = floorCounts.get(fl) || { free: 0, total: 0 };
            const active = fl === selectedFloor;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(fl)}
                className={`sh-chip ${active ? 'sh-chip-active' : ''}`}
              >
                <span>Lantai {fl}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    active
                      ? 'bg-white/20 text-white dark:bg-unnes-navy/20 dark:text-unnes-gold-ink'
                      : 'bg-surface-subtle text-[#3C4E70] dark:bg-[#192746] dark:text-[#CBD7EE]'
                  }`}
                >
                  {count.free}/{count.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="sh-card space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">
            Gedung {selectedBuilding} · Lantai {selectedFloor}
          </h2>
          <Legend compact />
        </div>

        {renderWing(northWing, 'Sisi Utara')}

        <div className="flex items-center justify-between rounded-lg border border-dashed border-[#C5CFE0] bg-surface-subtle/70 px-4 py-2.5 text-[11px] font-semibold text-[#526382] dark:border-[#293B61] dark:bg-unnes-night-input dark:text-unnes-night-muted">
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            Tangga Barat
          </span>
          <span className="font-mono tracking-widest uppercase">Koridor Lt. {selectedFloor}</span>
          <span className="inline-flex items-center gap-1.5">
            Tangga Timur
            <DoorOpen className="h-3.5 w-3.5" />
          </span>
        </div>

        {southWing.length > 0 && renderWing(southWing, 'Sisi Selatan')}
      </section>
    </div>
  );
}
