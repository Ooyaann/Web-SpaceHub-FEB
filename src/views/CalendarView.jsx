import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Users,
} from 'lucide-react';
import { OPERATIONAL_HOURS } from '../lib/constants';
import { formatHourRange, pad2 } from '../lib/dateWib';
import { getDaySummary, getRawSlotStatus, getSlotStatus } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import SelectPopover from '../components/SelectPopover';
import HourBar from '../components/HourBar';
import Legend from '../components/Legend';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function CalendarView() {
  const {
    rooms,
    bookings,
    reports,
    user,
    isAdmin,
    days,
    nowWib,
    openRoomDetail,
    openBookingForm,
    goToFindWithDate,
  } = useSpaceHub();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [scope, setScope] = useState('ALL'); // 'ALL' | 'B:L2' | 'B:L4' | 'B:L5' | 'R:L4 512'
  const [panelTab, setPanelTab] = useState('idle');

  const dayByKey = useMemo(() => new Map(days.map((d) => [d.key, d])), [days]);
  const roomByCode = useMemo(() => new Map(rooms.map((r) => [r.code, r])), [rooms]);

  // Daftar bulan unik dalam rentang 31 hari WIB (mis. Nov 2026 & Des 2026)
  const availableMonths = useMemo(() => {
    const seen = [];
    for (const d of days) {
      const [y, m] = d.key.split('-').map(Number);
      const id = `${y}-${pad2(m)}`;
      if (!seen.some((x) => x.id === id)) {
        seen.push({ id, year: y, month: m - 1, label: `${MONTHS_ID[m - 1]} ${y}` });
      }
    }
    return seen;
  }, [days]);

  const [monthIdx, setMonthIdx] = useState(0);
  const activeMonth = availableMonths[monthIdx] || availableMonths[0];

  const scopeOptions = useMemo(() => {
    const base = [
      { value: 'ALL', label: `Semua Ruang (${rooms.length})` },
      { value: 'B:L2', label: 'Gedung L2 (8 ruang)' },
      { value: 'B:L4', label: 'Gedung L4 (41 ruang)' },
      { value: 'B:L5', label: 'Gedung L5 (15 ruang)' },
    ];
    const specific = rooms.map((r) => ({
      value: `R:${r.code}`,
      label: `Ruang ${r.code} (${r.capacity} kursi)`,
    }));
    return [...base, ...specific];
  }, [rooms]);

  const isSingleRoomMode = scope.startsWith('R:');
  const singleRoom = isSingleRoomMode ? roomByCode.get(scope.slice(2)) : null;

  const scopedRooms = useMemo(() => {
    if (scope === 'ALL') return rooms;
    if (scope.startsWith('B:')) {
      const b = scope.slice(2);
      return rooms.filter((r) => r.building === b);
    }
    return singleRoom ? [singleRoom] : rooms;
  }, [rooms, scope, singleRoom]);

  // Hitung booking milik user per tanggal agar tampil sebagai penanda emas di kalender
  const myBookingsByDate = useMemo(() => {
    const map = new Map();
    const email = (user?.email || '').toLowerCase();
    for (const b of bookings) {
      if (b.status !== 'confirmed') continue;
      if (email && (b.user_email || '').toLowerCase() === email) {
        if (!map.has(b.booking_date)) map.set(b.booking_date, []);
        map.get(b.booking_date).push(b);
      }
    }
    return map;
  }, [bookings, user]);

  // Grid sel bulan aktif (Senin–Minggu)
  const monthCells = useMemo(() => {
    const firstUtc = new Date(Date.UTC(activeMonth.year, activeMonth.month, 1));
    const offset = (firstUtc.getUTCDay() + 6) % 7;
    const totalDays = new Date(Date.UTC(activeMonth.year, activeMonth.month + 1, 0)).getUTCDate();
    const cells = [];

    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (let dt = 1; dt <= totalDays; dt += 1) {
      const key = `${activeMonth.year}-${pad2(activeMonth.month + 1)}-${pad2(dt)}`;
      const dayObj = dayByKey.get(key) || null;
      if (!dayObj) {
        cells.push({ dt, key, dayObj: null });
        continue;
      }

      if (isSingleRoomMode && singleRoom) {
        const freeHours = OPERATIONAL_HOURS.filter(
          (h) =>
            getSlotStatus({
              roomCode: singleRoom.code,
              dateKey: dayObj.key,
              weekday: dayObj.weekday,
              hour: h,
              bookings,
              reports,
              userEmail: user?.email,
              todayWib: nowWib.dateKey,
              nowHourWib: nowWib.hour,
            }) === 'f'
        ).length;
        cells.push({
          dt,
          key,
          dayObj,
          freeHours,
          myCount: (myBookingsByDate.get(key) || []).filter((b) => b.room_code === singleRoom.code).length,
        });
      } else {
        const sum = getDaySummary({
          rooms: scopedRooms,
          dateKey: dayObj.key,
          weekday: dayObj.weekday,
          bookings,
          reports,
          userEmail: user?.email,
        });
        cells.push({
          dt,
          key,
          dayObj,
          summary: sum,
          myCount: (myBookingsByDate.get(key) || []).length,
        });
      }
    }
    return cells;
  }, [activeMonth, dayByKey, isSingleRoomMode, singleRoom, scopedRooms, bookings, reports, user, nowWib, myBookingsByDate]);

  const activeDay = days[selectedDayIdx] || days[0];
  const activeDayMyBookings = myBookingsByDate.get(activeDay.key) || [];

  const activeSummary = useMemo(
    () =>
      getDaySummary({
        rooms: scopedRooms,
        dateKey: activeDay.key,
        weekday: activeDay.weekday,
        bookings,
        reports,
        userEmail: user?.email,
      }),
    [scopedRooms, activeDay, bookings, reports, user]
  );

  const activeListCodes =
    panelTab === 'idle'
      ? activeSummary.idleRooms
      : panelTab === 'booked'
        ? activeSummary.withBooking
        : activeSummary.withClass;

  const handleSelectDay = (dayObj) => {
    setSelectedDayIdx(dayObj.index);
  };

  return (
    <div className="space-y-6">
      {/* Header + Scope Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Kalender Ketersediaan
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">
            Cek ketersediaan 30 hari ke depan untuk seluruh FEB, per gedung, atau satu ruangan spesifik.
          </p>
        </div>

        <div className="w-64">
          <SelectPopover
            label="Cakupan Kalender"
            icon={isSingleRoomMode ? DoorOpen : Building2}
            value={scope}
            onChange={(v) => setScope(v)}
            options={scopeOptions}
            align="right"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Real Monthly Calendar */}
        <section className="sh-card p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={monthIdx <= 0}
                onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
                aria-label="Bulan sebelumnya"
                className="rounded-lg border border-line-light p-1.5 text-[#3C4E70] transition hover:bg-surface-subtle disabled:opacity-30 dark:border-unnes-night-line dark:text-unnes-night-muted dark:hover:bg-[#192746]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-[140px] text-center text-sm font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">
                {activeMonth.label}
              </h2>
              <button
                type="button"
                disabled={monthIdx >= availableMonths.length - 1}
                onClick={() => setMonthIdx((i) => Math.min(availableMonths.length - 1, i + 1))}
                aria-label="Bulan berikutnya"
                className="rounded-lg border border-line-light p-1.5 text-[#3C4E70] transition hover:bg-surface-subtle disabled:opacity-30 dark:border-unnes-night-line dark:text-unnes-night-muted dark:hover:bg-[#192746]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium text-[#526382] dark:text-unnes-night-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                Lega
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-amber-500" />
                Sedang
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-unnes-gold" />
                Bookingmu
              </span>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase text-[#6A7B9C] dark:text-[#6E82AA]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((cell, i) => {
              if (!cell) return <div key={`blank-${i}`} />;
              if (!cell.dayObj) {
                return (
                  <div
                    key={cell.key}
                    className="flex min-h-[76px] flex-col justify-between rounded-lg border border-transparent bg-surface-subtle/40 p-2 text-slate-300 dark:bg-unnes-night-input/40 dark:text-[#2A395B]"
                  >
                    <span className="font-mono text-xs font-semibold">{cell.dt}</span>
                  </div>
                );
              }

              const isSelected = cell.dayObj.index === selectedDayIdx;
              const isToday = cell.dayObj.index === 0;

              let ratio = 0;
              let metricText = '';
              if (isSingleRoomMode) {
                ratio = cell.freeHours / 10;
                metricText = cell.freeHours > 0 ? `${cell.freeHours}j kosong` : 'Penuh';
              } else {
                const total = scopedRooms.length || 1;
                ratio = cell.summary.idleRooms.length / total;
                metricText = `${cell.summary.idleRooms.length}/${total}`;
              }

              const barColor =
                ratio >= 0.45 ? 'bg-emerald-500' : ratio >= 0.2 ? 'bg-amber-500' : 'bg-[#2563EB]';

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => handleSelectDay(cell.dayObj)}
                  className={`flex min-h-[76px] flex-col justify-between rounded-lg border p-2 text-left transition ${
                    isSelected
                      ? 'border-unnes-royal bg-unnes-royal/[0.06] ring-1 ring-unnes-royal dark:border-unnes-gold dark:bg-unnes-gold/10 dark:ring-unnes-gold'
                      : 'border-line-light bg-white hover:border-[#A8B8D8] dark:border-unnes-night-line dark:bg-unnes-night-input dark:hover:border-[#344A75]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isSelected
                          ? 'text-unnes-royal dark:text-unnes-gold'
                          : 'text-[#0F1B33] dark:text-[#F1F5FB]'
                      }`}
                    >
                      {cell.dt}
                    </span>
                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="rounded bg-unnes-royal px-1 py-0.2 text-[8px] font-bold text-white dark:bg-unnes-gold dark:text-unnes-gold-ink">
                          INI
                        </span>
                      )}
                      {cell.myCount > 0 && (
                        <span
                          title={`${cell.myCount} booking milikmu`}
                          className="h-2 w-2 rounded-full bg-unnes-gold"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] font-semibold text-[#526382] dark:text-unnes-night-muted">
                      {metricText}
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-subtle dark:bg-[#1B2B4B]">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.max(10, Math.round(ratio * 100))}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Inspector Panel */}
        <aside className="sh-card flex flex-col justify-between gap-5 p-5 lg:col-span-5">
          <div className="space-y-4">
            <div className="border-b border-line-light pb-3.5 dark:border-unnes-night-line">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6A7B9C] dark:text-[#6E82AA]">
                {isSingleRoomMode && singleRoom ? `Jadwal ${singleRoom.code}` : 'Ringkasan Tanggal'}
              </div>
              <h2 className="mt-0.5 text-lg font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">
                {activeDay.label}
                {activeDay.weekday === 0 ? ' · Minggu' : ''}
              </h2>
            </div>

            {/* Personal Bookings Highlight on Selected Date */}
            {activeDayMyBookings.length > 0 && (
              <div className="rounded-lg border border-unnes-gold/60 bg-[#FEF9C3]/70 p-3 dark:border-unnes-gold/40 dark:bg-unnes-gold/10">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#713F12] dark:text-unnes-gold">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Bookingmu di Tanggal Ini ({activeDayMyBookings.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {activeDayMyBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-xs font-semibold text-[#0F1B33] dark:text-[#F1F5FB]"
                    >
                      <span className="font-mono font-bold">{b.room_code}</span>
                      <span className="font-mono text-[11px] text-[#526382] dark:text-unnes-night-muted">
                        {formatHourRange(b.start_hour, b.duration)} · {b.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Room Mode Inspector vs Campus/Building Mode Inspector */}
            {isSingleRoomMode && singleRoom ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-surface-subtle p-3.5 dark:bg-unnes-night-input">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{singleRoom.code}</span>
                    <span className="text-xs text-[#526382] dark:text-unnes-night-muted">
                      {singleRoom.capacity} kursi · {singleRoom.location_label}
                    </span>
                  </div>
                </div>

                <HourBar
                  roomCode={singleRoom.code}
                  dateKey={activeDay.key}
                  weekday={activeDay.weekday}
                  bookings={bookings}
                  reports={reports}
                  userEmail={user?.email}
                  todayWib={nowWib.dateKey}
                  nowHourWib={nowWib.hour}
                  onSelectHour={isAdmin ? null : (h) => openBookingForm(singleRoom.code, selectedDayIdx, h)}
                />

                <Legend compact />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-2.5 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {activeSummary.idleRooms.length}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                      Kosong penuh
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
                    <div className="font-mono text-lg font-bold text-amber-700 dark:text-amber-300">
                      {activeSummary.withBooking.length}
                    </div>
                    <div className="text-[10px] font-semibold text-amber-800/80 dark:text-amber-300/80">
                      Dibooking
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200/80 bg-blue-50/70 p-2.5 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
                    <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">
                      {activeSummary.withClass.length}
                    </div>
                    <div className="text-[10px] font-semibold text-blue-800/80 dark:text-blue-300/80">
                      Ada kelas
                    </div>
                  </div>
                </div>

                {/* Segmented Filter */}
                <div className="grid grid-cols-3 rounded-lg border border-line-light bg-surface-subtle p-1 dark:border-unnes-night-line dark:bg-unnes-night-input">
                  {[
                    { id: 'idle', label: 'Kosong' },
                    { id: 'booked', label: 'Dibooking' },
                    { id: 'class', label: 'Kuliah' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPanelTab(t.id)}
                      className={`rounded-md py-1.5 text-xs font-bold transition ${
                        panelTab === t.id
                          ? 'bg-white text-[#0F1B33] shadow-subtle dark:bg-unnes-night-card dark:text-unnes-gold'
                          : 'text-[#526382] hover:text-[#0F1B33] dark:text-unnes-night-muted dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Room list with mini 10-hour spark-bar */}
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {activeListCodes.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line-light py-8 text-center text-xs text-[#6A7B9C] dark:border-unnes-night-line">
                      Tidak ada ruangan di kategori ini.
                    </div>
                  ) : (
                    activeListCodes.map((code) => {
                      const r = roomByCode.get(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => openRoomDetail(code, selectedDayIdx)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-line-light px-3 py-2 text-left transition hover:border-unnes-royal/50 hover:bg-surface-subtle/60 dark:border-unnes-night-line dark:hover:border-unnes-gold/50 dark:hover:bg-[#172442]"
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-bold text-[#0F1B33] dark:text-[#F1F5FB]">
                              {code}
                            </div>
                            {r && (
                              <div className="flex items-center gap-1 text-[10px] text-[#6A7B9C] dark:text-unnes-night-muted">
                                <Users className="h-3 w-3" />
                                {r.capacity} · Lt. {r.floor}
                              </div>
                            )}
                          </div>

                          {/* Mini 10-hour rhythm spark-bar */}
                          <div className="grid w-24 flex-none grid-cols-10 gap-0.5">
                            {OPERATIONAL_HOURS.map((h) => {
                              const st = getRawSlotStatus({
                                roomCode: code,
                                dateKey: activeDay.key,
                                weekday: activeDay.weekday,
                                hour: h,
                                bookings,
                                reports,
                                userEmail: user?.email,
                              });
                              const c =
                                st === 'f'
                                  ? 'bg-emerald-400/80'
                                  : st === 'k'
                                    ? 'bg-blue-500/75'
                                    : st === 'm'
                                      ? 'bg-unnes-gold'
                                      : 'bg-amber-500/80';
                              return <span key={h} className={`h-2.5 rounded-[2px] ${c}`} />;
                            })}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {isSingleRoomMode && singleRoom ? (
            <button
              type="button"
              onClick={() => openRoomDetail(singleRoom.code, selectedDayIdx)}
              className="sh-btn-primary w-full"
            >
              Lihat Detail & Booking {singleRoom.code}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToFindWithDate(selectedDayIdx)}
              className="sh-btn-primary w-full"
            >
              Cari Ruang di Tanggal Ini
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
