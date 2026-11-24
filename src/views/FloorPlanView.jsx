import { useMemo, useState } from 'react';
import { START_HOURS, getFloorOptions } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { getFreeUntilHour, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function FloorPlanView() {
  const { rooms, bookings, reports, user, days, nowWib, filters, updateFilter, openRoomDetail } =
    useSpaceHub();

  const floorOptions = useMemo(() => getFloorOptions(rooms), [rooms]);
  const [selectedFloor, setSelectedFloor] = useState(floorOptions[0]?.[0] || 'L2-3');

  const selectedDay = days[filters.day] || days[0];
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
            onClick={() => openRoomDetail(r.code, filters.day)}
            className={`rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 ${
              free
                ? 'border-unnes-gold bg-white text-[#0f1d3d] shadow-sm dark:bg-unnes-card-dark dark:text-white'
                : 'border-unnes-border bg-[#e6eeff]/60 text-slate-500 dark:border-unnes-border-dark dark:bg-[#172344] dark:text-slate-400'
            }`}
          >
            <div className="text-sm font-extrabold">{r.code}</div>
            <div className="mt-0.5 text-[11px] opacity-80">{r.capacity} orang</div>
            <div className="mt-2">
              {free ? (
                <span className="inline-block rounded-full bg-unnes-gold px-2 py-0.5 text-[10px] font-extrabold text-unnes-gold-ink">
                  Kosong s.d. {formatHour(until)}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Terpakai
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
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Denah Lantai</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Lihat posisi & status ruang kosong per gedung (L2, L4, L5) dan lantai pada waktu yang dipilih. Klik ruang
          untuk melihat detail & tarif.
        </p>
      </div>

      {/* Floor Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {floorOptions.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedFloor(key)}
            className={`sh-chip ${selectedFloor === key ? 'sh-chip-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Time Filter */}
      <div className="grid max-w-md grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tanggal</span>
          <select
            value={filters.day}
            onChange={(e) => updateFilter('day', Number(e.target.value))}
            className="sh-input"
          >
            {days.map((d) => (
              <option key={d.key} value={d.index}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam</span>
          <select
            value={filters.start}
            onChange={(e) => updateFilter('start', Number(e.target.value))}
            className="sh-input"
          >
            {START_HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)} WIB
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Denah Card */}
      <div className="sh-card space-y-4 p-5">
        {renderRow(topRow)}
        <div
          className="rounded-lg py-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(29,78,216,0.12) 0 16px, transparent 16px 24px)',
          }}
        >
          Lorong Koridor
        </div>
        {bottomRow.length > 0 && renderRow(bottomRow)}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Keterangan: <strong className="text-amber-600 dark:text-unnes-gold">Bingkai kuning</strong> menandakan ruang
        kosong; abu-abu menandakan sedang terpakai atau ada kelas.
      </p>
    </div>
  );
}
