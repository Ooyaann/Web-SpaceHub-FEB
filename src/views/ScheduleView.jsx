import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { OPERATIONAL_HOURS } from '../lib/constants';
import { pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
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

  const [building, setBuilding] = useState('L4');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [onlyWithFreeSlot, setOnlyWithFreeSlot] = useState(false);

  const selectedDay = days[filters.day] || days[0];

  const floorsInBuilding = useMemo(() => {
    const set = new Set(rooms.filter((r) => r.building === building).map((r) => r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms, building]);

  useEffect(() => {
    setFloorFilter('ALL');
  }, [building]);

  const floorOptions = useMemo(
    () => [
      { value: 'ALL', label: `Semua Lantai (${building})` },
      ...floorsInBuilding.map((fl) => ({ value: String(fl), label: `Lantai ${fl}` })),
    ],
    [building, floorsInBuilding]
  );

  const visibleRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        if (r.building !== building) return false;
        if (floorFilter !== 'ALL' && String(r.floor) !== floorFilter) return false;
        return true;
      })
      .map((r) => {
        const freeSlots = OPERATIONAL_HOURS.filter(
          (h) =>
            getSlotStatus({
              roomCode: r.code,
              dateKey: selectedDay.key,
              weekday: selectedDay.weekday,
              hour: h,
              bookings,
              reports,
              userEmail: user?.email,
              todayWib: nowWib.dateKey,
              nowHourWib: nowWib.hour,
            }) === 'f'
        ).length;
        return { ...r, freeSlots };
      })
      .filter((r) => !onlyWithFreeSlot || r.freeSlots > 0);
  }, [rooms, building, floorFilter, onlyWithFreeSlot, selectedDay, bookings, reports, user, nowWib]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Jadwal Ruang
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Timeline ketersediaan 07.00–17.00 WIB · klik kotak hijau untuk langsung booking.
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

      {/* Focused Filter Bar (1 Gedung at a time -> anti-overload) */}
      <div className="sh-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 rounded-xl border border-line-light bg-slate-50 p-1 dark:border-line-dark dark:bg-surface-subtle-dark">
            {['L2', 'L4', 'L5'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBuilding(b)}
                className={`rounded-lg px-3.5 text-xs font-bold transition ${
                  building === b
                    ? 'bg-brand text-white shadow-sm dark:bg-brand-dark'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Gedung {b}
              </button>
            ))}
          </div>

          <div className="w-48">
            <SelectPopover
              icon={Building2}
              value={floorFilter}
              onChange={(v) => setFloorFilter(v)}
              options={floorOptions}
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithFreeSlot((v) => !v)}
            className={`sh-control flex w-auto items-center gap-2 px-3.5 text-xs font-semibold ${
              onlyWithFreeSlot
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300'
                : ''
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Ada slot kosong saja
          </button>
        </div>

        <Legend compact />
      </div>

      {/* Breathable Timeline Matrix */}
      <div className="sh-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Sticky Column Header */}
            <div className="grid grid-cols-[150px_1fr_72px] items-center gap-4 border-b border-line-light bg-slate-50 px-5 py-3 dark:border-line-dark dark:bg-surface-subtle-dark">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ruangan ({visibleRooms.length})
              </span>
              <div className="grid grid-cols-10 gap-1.5 text-center text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {OPERATIONAL_HOURS.map((h) => (
                  <span key={h}>{pad2(h)}.00</span>
                ))}
              </div>
              <span className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Kosong
              </span>
            </div>

            {visibleRooms.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Tidak ada ruangan dengan slot kosong di filter ini.
              </div>
            ) : (
              <div className="divide-y divide-line-light dark:divide-line-dark">
                {visibleRooms.map((r) => (
                  <div
                    key={r.code}
                    className="grid grid-cols-[150px_1fr_72px] items-center gap-4 px-5 py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <button
                      type="button"
                      onClick={() => openRoomDetail(r.code, filters.day)}
                      className="min-w-0 text-left"
                    >
                      <div className="truncate text-xs font-extrabold text-slate-900 hover:text-brand dark:text-white dark:hover:text-blue-400">
                        {r.code}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Lt. {r.floor} · {r.capacity} kursi
                      </div>
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

                    <div className="text-right">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                          r.freeSlots > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}
                      >
                        {r.freeSlots}/10j
                      </span>
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
