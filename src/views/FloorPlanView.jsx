import { useEffect, useMemo, useState } from 'react';
import { Clock, DoorOpen } from 'lucide-react';
import { SLOT_LABELS, START_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

/* Solid, opaque architectural fills — NO neon transparent borders */
const TILE_FILLS = {
  f: 'bg-[#ECF8F1] hover:bg-[#DCF1E5] dark:bg-[#1D342C] dark:hover:bg-[#244237]',
  k: 'bg-[#EEF3FC] hover:bg-[#E1EAFA] dark:bg-[#212D48] dark:hover:bg-[#283758]',
  o: 'bg-[#FDF4E6] hover:bg-[#FAE9CE] dark:bg-[#352A1E] dark:hover:bg-[#413425]',
  m: 'bg-[#FEF7DB] hover:bg-[#FCEFB8] dark:bg-[#42381C] dark:hover:bg-[#4F4321]',
  p: 'bg-[#F3F4F7] opacity-70 dark:bg-[#1B202E]',
};

const DOT_COLORS = {
  f: 'bg-[#22A06B]',
  k: 'bg-[#3B6DD8]',
  o: 'bg-[#D97706]',
  m: 'bg-unnes-gold',
  p: 'bg-[#9CA6BA]',
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
      <div className="mb-2.5 text-xs font-medium text-[#7B869B] dark:text-[#8693AA]">{wingLabel}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const isLab = r.code.includes('Lab');
          return (
            <button
              key={r.code}
              type="button"
              title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
              onClick={() => openRoomDetail(r.code, filters.day)}
              className={`flex flex-col justify-between rounded-xl p-4 text-left transition ${TILE_FILLS[r.status]}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-[#141923] dark:text-[#EEF2F7]">{r.code}</span>
                  {isLab && (
                    <span className="text-[11px] font-semibold text-[#5B667B] dark:text-unnes-gold">Lab</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[#5B667B] dark:text-[#9AA7BE]">{r.capacity} kursi</div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#1E2636] dark:text-[#DCE3F0]">
                <span className={`h-2 w-2 rounded-full ${DOT_COLORS[r.status]}`} />
                <span>
                  {r.status === 'f' ? `Kosong s.d. ${formatHour(r.freeUntil)}` : SLOT_LABELS[r.status]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header & Controls on clean canvas */}
      <div className="space-y-5 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
              Denah lantai
            </h1>
            <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
              Klik ruang untuk melihat detail, tarif, dan booking.
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

        {/* Building & Floor Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-[#F1F3F7] p-1 dark:bg-ink-card">
              {buildings.map(({ building }) => (
                <button
                  key={building}
                  type="button"
                  onClick={() => setSelectedBuilding(building)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                    building === selectedBuilding
                      ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]'
                  }`}
                >
                  Gedung {building}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
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
                    <span className="tabular-nums opacity-75">
                      {count.free}/{count.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#5B667B] dark:text-[#9AA7BE]">
            <span>
              <strong className="font-semibold text-[#141923] dark:text-[#EEF2F7]">{summary.free}</strong> kosong
            </span>
            <span>
              <strong className="font-semibold text-[#141923] dark:text-[#EEF2F7]">{summary.kuliah}</strong> kuliah
            </span>
            <span>
              <strong className="font-semibold text-[#141923] dark:text-[#EEF2F7]">{summary.used}</strong> dibooking
            </span>
          </div>
        </div>
      </div>

      {/* Floorplan Surface */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#141923] dark:text-[#EEF2F7]">
            Gedung {selectedBuilding} · Lantai {selectedFloor}
          </h2>
          <Legend compact />
        </div>

        {renderWing(northWing, 'Sisi utara')}

        <div className="flex items-center justify-between rounded-lg bg-[#F5F6F9] px-4 py-3 text-xs font-medium text-[#6B768C] dark:bg-ink-card dark:text-[#8E9BB3]">
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            Tangga barat
          </span>
          <span>Koridor lantai {selectedFloor}</span>
          <span className="inline-flex items-center gap-1.5">
            Tangga timur
            <DoorOpen className="h-3.5 w-3.5" />
          </span>
        </div>

        {southWing.length > 0 && renderWing(southWing, 'Sisi selatan')}
      </section>
    </div>
  );
}
