import { useEffect, useMemo } from 'react';
import { ArrowUpRight, Clock, DoorOpen } from 'lucide-react';
import { SLOT_LABELS, START_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import Legend from '../components/Legend';

/* Clean Neutral Architectural Cards — ZERO murky green/blue background swamps */
const TILE_STYLES = {
  f: 'border border-[#D5DCE8] border-l-[3.5px] border-l-[#10B981] bg-white shadow-card hover:-translate-y-0.5 hover:border-[#B4C0D4] hover:border-l-[#10B981] hover:shadow-card-hover dark:border-ink-line dark:border-l-[#10B981] dark:bg-ink-card dark:hover:border-ink-line-strong dark:hover:border-l-[#10B981]',
  m: 'border border-unnes-gold/60 border-l-[3.5px] border-l-unnes-gold bg-white shadow-card hover:-translate-y-0.5 dark:border-unnes-gold/40 dark:border-l-unnes-gold dark:bg-ink-card',
  k: 'border border-[#E4E7EC] bg-[#EFF2F6] text-[#667085] hover:border-[#CFD6E2] dark:border-ink-line/70 dark:bg-[#181B22] dark:hover:border-ink-line',
  o: 'border border-[#E8DFCE] bg-[#FAF6EE] hover:border-[#DECBA8] dark:border-[#3D3322] dark:bg-[#211E18] dark:hover:border-[#52442D]',
  p: 'border border-[#E6E9EF] bg-[#F2F4F7] opacity-75 dark:border-ink-line/50 dark:bg-[#14171D]',
};

const DOT_COLORS = {
  f: 'bg-[#10B981]',
  k: 'bg-[#64748B] dark:bg-[#7E879B]',
  o: 'bg-[#F59E0B]',
  m: 'bg-unnes-gold',
  p: 'bg-[#98A2B3] dark:bg-[#525B6E]',
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
      <div className="mb-2.5 text-xs font-semibold text-[#667085] dark:text-[#8A93A6]">{wingLabel}</div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const isLab = Number(r.price_per_hour) > 0 || r.code.includes('Lab');
          const isAvailable = r.status === 'f' || r.status === 'm';
          return (
            <button
              key={r.code}
              type="button"
              title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
              onClick={() => openRoomDetail(r.code, filters.day)}
              className={`group flex flex-col justify-between rounded-xl p-4 text-left transition-all duration-150 active:scale-[0.99] ${TILE_STYLES[r.status]}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[15px] font-bold tracking-tight ${
                      isAvailable
                        ? 'text-[#101828] dark:text-[#F5F7FA]'
                        : 'text-[#475467] dark:text-[#98A2B3]'
                    }`}
                  >
                    {r.code}
                  </span>

                  {isLab ? (
                    <span className="rounded-md bg-[#FEF8E6] px-2 py-0.5 text-[10px] font-semibold text-[#92400E] dark:bg-[#2F2817] dark:text-unnes-gold">
                      Lab
                    </span>
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#98A2B3] opacity-0 transition-all group-hover:opacity-100 dark:text-[#8A93A6]" />
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[#667085] dark:text-[#8A93A6]">{r.capacity} kursi</div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#ECEFF4] pt-2.5 dark:border-white/[0.06]">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    r.status === 'f'
                      ? 'text-[#067647] dark:text-[#F5F7FA]'
                      : r.status === 'm'
                        ? 'text-[#92400E] dark:text-unnes-gold'
                        : 'text-[#667085] dark:text-[#8A93A6]'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${DOT_COLORS[r.status]}`} />
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">
            Denah lantai
          </h1>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Peta tata ruang per lantai. Klik ruang mana saja untuk melihat foto, tarif, dan booking.
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
            label="Jam cek"
            icon={Clock}
            value={filters.start}
            onChange={(v) => updateFilter('start', Number(v))}
            options={hourOptions}
            align="right"
          />
        </div>
      </div>

      {/* Selector Panel */}
      <div className="sh-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-[#DCE2EC] bg-[#F2F4F8] p-1 dark:border-ink-line dark:bg-ink-canvas">
            {buildings.map(({ building }) => (
              <button
                key={building}
                type="button"
                onClick={() => setPlanPrefs((prev) => ({ ...prev, building }))}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  building === selectedBuilding
                    ? 'bg-unnes-navy text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                    : 'text-[#475467] hover:text-[#101828] dark:text-[#B0B8C9] dark:hover:text-[#F5F7FA]'
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
                  onClick={() => setPlanPrefs((prev) => ({ ...prev, floor: fl }))}
                  className={`sh-chip ${active ? 'sh-chip-active' : ''}`}
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

        <div className="flex items-center gap-4 text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.free}</strong> kosong
          </span>
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.kuliah}</strong>{' '}
            kuliah
          </span>
          <span>
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{summary.used}</strong>{' '}
            dibooking
          </span>
        </div>
      </div>

      {/* Architectural Floor Map */}
      <section className="sh-panel space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECEFF4] pb-4 dark:border-ink-line">
          <h2 className="text-base font-bold text-[#101828] dark:text-[#F5F7FA]">
            Gedung {selectedBuilding} · Lantai {selectedFloor}
          </h2>
          <Legend compact />
        </div>

        {renderWing(northWing, 'Sayap utara')}

        <div className="flex items-center justify-between rounded-xl border border-dashed border-[#D5DCE8] bg-[#F5F7FA] px-4 py-3 text-xs font-medium text-[#667085] dark:border-ink-line dark:bg-ink-canvas dark:text-[#8A93A6]">
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" />
            Tangga barat
          </span>
          <span className="font-semibold tracking-wide">Koridor utama lantai {selectedFloor}</span>
          <span className="inline-flex items-center gap-1.5">
            Tangga timur
            <DoorOpen className="h-3.5 w-3.5" />
          </span>
        </div>

        {southWing.length > 0 && renderWing(southWing, 'Sayap selatan')}
      </section>
    </div>
  );
}
