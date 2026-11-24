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
  f: 'border-emerald-300/90 bg-emerald-50/70 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:hover:border-emerald-400',
  k: 'border-blue-200 bg-blue-50/60 hover:border-blue-400 dark:border-blue-500/30 dark:bg-blue-500/10 dark:hover:border-blue-400',
  o: 'border-amber-200 bg-amber-50/60 hover:border-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:border-amber-400',
  m: 'border-yellow-400 bg-yellow-50/80 hover:border-yellow-500 dark:border-yellow-400/50 dark:bg-yellow-500/15',
  p: 'border-line-light bg-slate-50 opacity-70 dark:border-line-dark dark:bg-slate-800/40',
};

const BADGE_STYLES = {
  f: 'bg-emerald-600 text-white dark:bg-emerald-500',
  k: 'bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300',
  o: 'bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300',
  m: 'bg-yellow-400 text-slate-950',
  p: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
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
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{wingLabel}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const isLab = r.code.includes('Lab');
          return (
            <button
              key={r.code}
              type="button"
              title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
              onClick={() => openRoomDetail(r.code, filters.day)}
              className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition duration-150 hover:-translate-y-0.5 ${TILE_STYLES[r.status]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{r.code}</span>
                    {isLab && (
                      <span className="rounded bg-slate-900/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-white/15 dark:text-slate-200">
                        LAB
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Users className="h-3 w-3" />
                    {r.capacity} kursi
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-1">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLES[r.status]}`}>
                  {r.status === 'f' ? `Kosong s.d. ${formatHour(r.freeUntil)}` : SLOT_LABELS[r.status]}
                </span>
                <span className="text-[10px] font-medium text-slate-400 opacity-0 transition group-hover:opacity-100">
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
      {/* Header + Time Controls */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Denah Lantai</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Posisi dan status ruang tiap lantai · klik ruang untuk lihat detail & booking.
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
          <div className="inline-flex rounded-xl border border-line-light bg-slate-50 p-1 dark:border-line-dark dark:bg-surface-subtle-dark">
            {buildings.map(({ building }) => {
              const active = building === selectedBuilding;
              return (
                <button
                  key={building}
                  type="button"
                  onClick={() => setSelectedBuilding(building)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-brand text-white shadow-sm dark:bg-brand-dark'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Gedung {building}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-emerald-600 dark:text-emerald-400">{summary.free} Kosong</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-blue-600 dark:text-blue-400">{summary.kuliah} Ada kelas</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-amber-600 dark:text-amber-400">{summary.used} Dibooking</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-line-light pt-3 dark:border-line-dark">
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
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {count.free}/{count.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Architectural Floor Plan Canvas */}
      <section className="sh-card space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Gedung {selectedBuilding} · Lantai {selectedFloor}
          </h2>
          <Legend compact />
        </div>

        {renderWing(northWing, 'Sisi Utara')}

        {/* Corridor Divider */}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-surface-subtle-dark dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            Akses Tangga Barat
          </span>
          <span className="tracking-widest uppercase">Koridor Lantai {selectedFloor}</span>
          <span className="inline-flex items-center gap-1.5">
            Akses Tangga Timur
            <DoorOpen className="h-3.5 w-3.5" />
          </span>
        </div>

        {southWing.length > 0 && renderWing(southWing, 'Sisi Selatan')}
      </section>
    </div>
  );
}
