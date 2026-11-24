import { useMemo, useState } from 'react';
import { OPERATIONAL_HOURS, getFloorOptions } from '../lib/constants';
import { pad2 } from '../lib/dateWib';
import { isRoomIdleAllDay } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import HourBar from '../components/HourBar';
import Legend from '../components/Legend';

export default function ScheduleView() {
  const {
    rooms,
    bookings,
    reports,
    user,
    days,
    nowWib,
    filters,
    updateFilter,
    openRoomDetail,
    openBookingForm,
  } = useSpaceHub();

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Jadwal Ruang</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {idleCount} dari {rooms.length} ruang kosong seharian · klik kotak hijau untuk langsung booking.
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'L2', 'L4', 'L5'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBuildingFilter(b)}
              className={`sh-chip ${buildingFilter === b ? 'sh-chip-active' : ''}`}
            >
              {b === 'ALL' ? 'Semua' : `Gedung ${b}`}
            </button>
          ))}
        </div>

        <Legend compact />
      </div>

      <div className="sh-card space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-[84px_1fr] items-center gap-3 border-b border-unnes-border pb-2 dark:border-unnes-border-dark">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ruang</span>
          <div className="grid grid-cols-10 gap-1 text-center text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
            {OPERATIONAL_HOURS.map((h) => (
              <span key={h}>{pad2(h)}</span>
            ))}
          </div>
        </div>

        {visibleFloors.map(([floorKey, floorLabel]) => {
          const groupRooms = rooms.filter((r) => `${r.building}-${r.floor}` === floorKey);
          return (
            <div key={floorKey} className="space-y-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-unnes-blue dark:text-unnes-gold">
                {floorLabel}
              </h3>
              <div className="space-y-1.5">
                {groupRooms.map((r) => (
                  <div
                    key={r.code}
                    className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-lg py-0.5 hover:bg-unnes-surface/60 dark:hover:bg-[#172344]/60"
                  >
                    <button
                      type="button"
                      onClick={() => openRoomDetail(r.code, filters.day)}
                      className="truncate text-left text-xs font-bold text-[#0f1d3d] hover:text-unnes-blue hover:underline dark:text-white dark:hover:text-unnes-gold"
                    >
                      {r.code}
                    </button>
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
                      onSelectHour={(hour) => openBookingForm(r.code, filters.day, hour)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
