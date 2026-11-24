import { useMemo, useState } from 'react';
import { START_HOURS, getFloorOptions } from '../lib/constants';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';

export default function FloorPlanView() {
  const { rooms, bookings, reports, user, days, nowWib, filters, updateFilter, openRoomDetail } =
    useSpaceHub();

  const floorOptions = useMemo(() => getFloorOptions(rooms), [rooms]);
  const [selectedFloor, setSelectedFloor] = useState(floorOptions[0]?.[0] || 'L2-3');

  const selectedDay = days[filters.day] || days[0];

  const floorStats = useMemo(() => {
    const map = new Map();
    for (const [key] of floorOptions) {
      const list = rooms.filter((r) => `${r.building}-${r.floor}` === key);
      const freeCount = list.filter((r) =>
        isWindowFree({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          duration: 1,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        })
      ).length;
      map.set(key, { freeCount, total: list.length });
    }
    return map;
  }, [floorOptions, rooms, selectedDay, filters.start, bookings, reports, user, nowWib]);

  const floorRooms = useMemo(
    () => rooms.filter((r) => `${r.building}-${r.floor}` === selectedFloor),
    [rooms, selectedFloor]
  );

  const half = Math.ceil(floorRooms.length / 2);
  const topRow = floorRooms.slice(0, half);
  const bottomRow = floorRooms.slice(half);

  const renderRow = (list) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {list.map((r) => {
        const free = isWindowFree({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          duration: 1,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        });
        const until = getFreeUntilHour({
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

        return (
          <button
            key={r.code}
            type="button"
            title={`${r.code} · ${(r.facilities || []).join(', ')} · ${formatPriceBadge(r.price_per_hour)}`}
            onClick={() => openRoomDetail(r.code, filters.day)}
            className={`rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 ${
              free
                ? 'border-unnes-gold bg-white text-[#0f1d3d] shadow-sm dark:bg-unnes-card-dark dark:text-white'
                : 'border-unnes-border bg-unnes-surface/80 text-slate-500 dark:border-unnes-border-dark dark:bg-[#142040] dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-extrabold">{r.code}</span>
              <span className="text-[10px] font-semibold opacity-75">{r.capacity}k</span>
            </div>
            <div className="mt-2">
              {free ? (
                <span className="inline-block rounded-full bg-unnes-gold px-2 py-0.5 text-[10px] font-extrabold text-unnes-gold-ink">
                  s.d. {formatHour(until)}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Terisi
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Denah Lantai</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Bingkai kuning = kosong · klik ruang untuk detail & booking.
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-2.5">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
          />
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam</span>
            <select
              value={filters.start}
              onChange={(e) => updateFilter('start', Number(e.target.value))}
              className="sh-input font-semibold"
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Floor Tabs with Free/Total Count */}
      <div className="flex flex-wrap gap-1.5">
        {floorOptions.map(([key, label]) => {
          const st = floorStats.get(key) || { freeCount: 0, total: 0 };
          const active = selectedFloor === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedFloor(key)}
              className={`sh-chip ${active ? 'sh-chip-active' : ''}`}
            >
              <span>{label.replace('Gedung ', '').replace(' · Lantai ', ' Lt.')}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  active
                    ? 'bg-unnes-navy text-white'
                    : 'bg-unnes-surface text-unnes-blue dark:bg-[#19264a] dark:text-unnes-gold'
                }`}
              >
                {st.freeCount}/{st.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Denah Card */}
      <div className="sh-card space-y-4 p-5">
        {renderRow(topRow)}
        <div
          className="rounded-lg py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(29,78,216,0.12) 0 14px, transparent 14px 22px)',
          }}
        >
          Koridor
        </div>
        {bottomRow.length > 0 && renderRow(bottomRow)}
      </div>
    </div>
  );
}
