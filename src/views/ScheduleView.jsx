import { useMemo, useState } from 'react';
import { OPERATIONAL_HOURS, getFloorOptions } from '../lib/constants';
import { pad2 } from '../lib/dateWib';
import { isRoomIdleAllDay } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import HourBar from '../components/HourBar';
import Legend from '../components/Legend';

export default function ScheduleView() {
  const { rooms, bookings, reports, user, days, nowWib, filters, updateFilter, openRoomDetail } =
    useSpaceHub();

  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const selectedDay = days[filters.day] || days[0];

  const floorOptions = useMemo(() => getFloorOptions(rooms), [rooms]);
  const visibleFloors = useMemo(
    () => floorOptions.filter(([key]) => buildingFilter === 'ALL' || key.startsWith(`${buildingFilter}-`)),
    [floorOptions, buildingFilter]
  );

  const idleCount = useMemo(
    () =>
      rooms.filter((r) =>
        isRoomIdleAllDay({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          bookings,
          reports,
          userEmail: user?.email,
        })
      ).length,
    [rooms, selectedDay, bookings, reports, user]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Jadwal Semua Ruang</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Matriks ketersediaan seluruh {rooms.length} ruang per jam pada <strong>{selectedDay.label}</strong>.{' '}
          {idleCount} ruang tidak dipakai seharian.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block w-full max-w-xs">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pilih Tanggal</span>
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

        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'L2', 'L4', 'L5'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBuildingFilter(b)}
              className={`sh-chip ${buildingFilter === b ? 'sh-chip-active' : ''}`}
            >
              {b === 'ALL' ? 'Semua Gedung' : `Gedung ${b}`}
            </button>
          ))}
        </div>
      </div>

      <Legend />

      <div className="sh-card space-y-5 p-4 sm:p-5">
        {/* Sticky Hour Header */}
        <div className="grid grid-cols-[84px_1fr] items-center gap-3 border-b border-unnes-border pb-2 dark:border-unnes-border-dark">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ruang
          </span>
          <div className="grid grid-cols-10 gap-1 text-center text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
            {OPERATIONAL_HOURS.map((h) => (
              <span key={h}>{pad2(h)}</span>
            ))}
          </div>
        </div>

        {visibleFloors.map(([floorKey, floorLabel]) => {
          const groupRooms = rooms.filter((r) => `${r.building}-${r.floor}` === floorKey);
          return (
            <div key={floorKey} className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-unnes-blue dark:text-unnes-gold">
                {floorLabel} ({groupRooms.length})
              </h3>
              <div className="space-y-2">
                {groupRooms.map((r) => {
                  const idle = isRoomIdleAllDay({
                    roomCode: r.code,
                    dateKey: selectedDay.key,
                    weekday: selectedDay.weekday,
                    bookings,
                    reports,
                    userEmail: user?.email,
                  });
                  return (
                    <div
                      key={r.code}
                      className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-lg py-0.5 hover:bg-unnes-surface/60 dark:hover:bg-[#172344]/60"
                    >
                      <button
                        type="button"
                        onClick={() => openRoomDetail(r.code, filters.day)}
                        className="truncate text-left text-xs font-bold text-[#0f1d3d] hover:text-unnes-blue hover:underline dark:text-white dark:hover:text-unnes-blue-light"
                      >
                        {r.code}
                      </button>
                      <div>
                        <HourBar
                          roomCode={r.code}
                          dateKey={selectedDay.key}
                          weekday={selectedDay.weekday}
                          bookings={bookings}
                          reports={reports}
                          userEmail={user?.email}
                          todayWib={nowWib.dateKey}
                          nowHourWib={nowWib.hour}
                          showLabels={false}
                          compact
                        />
                        {idle && (
                          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            Kosong seharian
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
