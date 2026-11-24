import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
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
  const [scope, setScope] = useState('ALL');
  const [panelTab, setPanelTab] = useState('idle');

  const dayByKey = useMemo(() => new Map(days.map((d) => [d.key, d])), [days]);
  const roomByCode = useMemo(() => new Map(rooms.map((r) => [r.code, r])), [rooms]);

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
      { value: 'ALL', label: `Semua ruang (${rooms.length})` },
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
    if (scope.startsWith('B:')) return rooms.filter((r) => r.building === scope.slice(2));
    return singleRoom ? [singleRoom] : rooms;
  }, [rooms, scope, singleRoom]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
            Kalender
          </h1>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Lihat hari paling longgar untuk seluruh FEB, per gedung, atau satu ruangan.
          </p>
        </div>

        <div className="w-64">
          <SelectPopover
            label="Cakupan"
            icon={isSingleRoomMode ? DoorOpen : Building2}
            value={scope}
            onChange={(v) => setScope(v)}
            options={scopeOptions}
            align="right"
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Clean Monthly Grid */}
        <section className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={monthIdx <= 0}
                onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
                aria-label="Bulan sebelumnya"
                className="rounded-lg p-1.5 text-[#5B667B] transition hover:bg-[#F1F3F7] disabled:opacity-30 dark:text-[#9AA7BE] dark:hover:bg-ink-card"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-[140px] text-center text-[15px] font-bold text-[#141923] dark:text-[#EEF2F7]">
                {activeMonth.label}
              </h2>
              <button
                type="button"
                disabled={monthIdx >= availableMonths.length - 1}
                onClick={() => setMonthIdx((i) => Math.min(availableMonths.length - 1, i + 1))}
                aria-label="Bulan berikutnya"
                className="rounded-lg p-1.5 text-[#5B667B] transition hover:bg-[#F1F3F7] disabled:opacity-30 dark:text-[#9AA7BE] dark:hover:bg-ink-card"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6B768C] dark:text-[#8E9BB3]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22A06B]" />
                Lega
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                Sedang
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-unnes-gold" />
                Bookingmu
              </span>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-[#7B869B] dark:text-[#8693AA]">
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
                    className="flex min-h-[76px] flex-col justify-between rounded-lg bg-[#F7F8FA] p-2.5 text-[#C5CCD9] dark:bg-ink-card/40 dark:text-[#444F66]"
                  >
                    <span className="text-xs font-medium tabular-nums">{cell.dt}</span>
                  </div>
                );
              }

              const isSelected = cell.dayObj.index === selectedDayIdx;
              const isToday = cell.dayObj.index === 0;

              let ratio = 0;
              let metricText = '';
              if (isSingleRoomMode) {
                ratio = cell.freeHours / 10;
                metricText = cell.freeHours > 0 ? `${cell.freeHours}j` : 'Penuh';
              } else {
                const total = scopedRooms.length || 1;
                ratio = cell.summary.idleRooms.length / total;
                metricText = `${cell.summary.idleRooms.length}/${total}`;
              }

              const barColor =
                ratio >= 0.45 ? 'bg-[#22A06B]' : ratio >= 0.2 ? 'bg-[#D97706]' : 'bg-[#3B6DD8]';

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDayIdx(cell.dayObj.index)}
                  className={`flex min-h-[76px] flex-col justify-between rounded-lg p-2.5 text-left transition ${
                    isSelected
                      ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'bg-[#F6F7FA] text-[#141923] hover:bg-[#ECEFF5] dark:bg-ink-card dark:text-[#EEF2F7] dark:hover:bg-ink-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold tabular-nums">{cell.dt}</span>
                    <div className="flex items-center gap-1">
                      {isToday && !isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-unnes-navy dark:bg-unnes-gold" />
                      )}
                      {cell.myCount > 0 && (
                        <span
                          title={`${cell.myCount} booking milikmu`}
                          className={`h-2 w-2 rounded-full ${isSelected ? 'bg-unnes-gold dark:bg-unnes-navy' : 'bg-unnes-gold'}`}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-[11px] font-medium tabular-nums ${
                        isSelected ? 'opacity-85' : 'text-[#5B667B] dark:text-[#9AA7BE]'
                      }`}
                    >
                      {metricText}
                    </div>
                    <div
                      className={`mt-1 h-1 w-full overflow-hidden rounded-full ${
                        isSelected ? 'bg-white/25 dark:bg-black/20' : 'bg-[#E2E6EE] dark:bg-ink-subtle'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${isSelected ? 'bg-unnes-gold dark:bg-unnes-navy' : barColor}`}
                        style={{ width: `${Math.max(10, Math.round(ratio * 100))}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Calm Solid Inspector */}
        <aside className="sh-panel flex flex-col justify-between gap-5 p-5 lg:col-span-5">
          <div className="space-y-5">
            <div className="border-b border-[#EAECEF] pb-4 dark:border-white/[0.08]">
              <p className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">
                {isSingleRoomMode && singleRoom ? `Jadwal ${singleRoom.code}` : 'Ringkasan tanggal'}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-[#141923] dark:text-[#EEF2F7]">
                {activeDay.label}
                {activeDay.weekday === 0 ? ' (Minggu)' : ''}
              </h2>
            </div>

            {activeDayMyBookings.length > 0 && (
              <div className="rounded-lg bg-[#FEF7DB] p-3.5 dark:bg-[#3A311B]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#713F12] dark:text-unnes-gold">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Bookingmu di tanggal ini ({activeDayMyBookings.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {activeDayMyBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-xs font-medium text-[#141923] dark:text-[#EEF2F7]"
                    >
                      <span className="font-semibold">{b.room_code}</span>
                      <span className="font-mono text-[11px] opacity-80">
                        {formatHourRange(b.start_hour, b.duration)} · {b.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSingleRoomMode && singleRoom ? (
              <div className="space-y-4">
                <div className="text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
                  <strong className="text-[#141923] dark:text-[#EEF2F7]">{singleRoom.code}</strong> ·{' '}
                  {singleRoom.capacity} kursi · {singleRoom.location_label}
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
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-[#F6F7FA] p-3 dark:bg-ink-subtle">
                    <div className="text-lg font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
                      {activeSummary.idleRooms.length}
                    </div>
                    <div className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">Kosong</div>
                  </div>
                  <div className="rounded-lg bg-[#F6F7FA] p-3 dark:bg-ink-subtle">
                    <div className="text-lg font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
                      {activeSummary.withBooking.length}
                    </div>
                    <div className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">Dibooking</div>
                  </div>
                  <div className="rounded-lg bg-[#F6F7FA] p-3 dark:bg-ink-subtle">
                    <div className="text-lg font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
                      {activeSummary.withClass.length}
                    </div>
                    <div className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">Kuliah</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 rounded-lg bg-[#F1F3F7] p-1 dark:bg-ink-subtle">
                  {[
                    { id: 'idle', label: 'Kosong' },
                    { id: 'booked', label: 'Dibooking' },
                    { id: 'class', label: 'Kuliah' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPanelTab(t.id)}
                      className={`rounded-md py-1.5 text-xs font-semibold transition ${
                        panelTab === t.id
                          ? 'bg-white text-[#141923] shadow-sm dark:bg-ink-card dark:text-[#EEF2F7]'
                          : 'text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-64 divide-y divide-[#EEF0F4] overflow-y-auto pr-1 dark:divide-white/[0.06]">
                  {activeListCodes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#7B869B] dark:text-[#8693AA]">
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
                          className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition hover:opacity-80"
                        >
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#141923] dark:text-[#EEF2F7]">{code}</div>
                            {r && (
                              <div className="text-xs text-[#7B869B] dark:text-[#8693AA]">
                                {r.capacity} kursi · Lt. {r.floor}
                              </div>
                            )}
                          </div>

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
                                  ? 'bg-[#22A06B]'
                                  : st === 'k'
                                    ? 'bg-[#3B6DD8]'
                                    : st === 'm'
                                      ? 'bg-unnes-gold'
                                      : 'bg-[#D97706]';
                              return <span key={h} className={`h-2 rounded-[2px] ${c}`} />;
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
              Detail & booking {singleRoom.code}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToFindWithDate(selectedDayIdx)}
              className="sh-btn-primary w-full"
            >
              Cari ruang di tanggal ini
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
