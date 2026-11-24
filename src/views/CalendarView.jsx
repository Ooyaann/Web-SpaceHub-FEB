import { useMemo, useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { getDaySummary } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function CalendarView() {
  const { rooms, bookings, reports, user, days, openRoomDetail, goToFindWithDate } = useSpaceHub();
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [panelTab, setPanelTab] = useState('idle'); // 'idle' | 'booked' | 'class'

  const roomByCode = useMemo(() => new Map(rooms.map((r) => [r.code, r])), [rooms]);

  const daySummaries = useMemo(
    () =>
      days.map((d) =>
        getDaySummary({
          rooms,
          dateKey: d.key,
          weekday: d.weekday,
          bookings,
          reports,
          userEmail: user?.email,
        })
      ),
    [rooms, days, bookings, reports, user]
  );

  const startOffset = (days[0].weekday + 6) % 7;
  const activeDay = days[selectedDayIdx] || days[0];
  const activeSummary = daySummaries[selectedDayIdx] || { withClass: [], withBooking: [], idleRooms: [] };

  const activeListCodes =
    panelTab === 'idle'
      ? activeSummary.idleRooms
      : panelTab === 'booked'
        ? activeSummary.withBooking
        : activeSummary.withClass;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Kalender Ketersediaan
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Pantau hari paling longgar dalam 30 hari ke depan ({days[0].shortDate} – {days[days.length - 1].shortDate}),
          lalu langsung cari ruang di tanggal pilihan.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Clean Spacious Calendar Grid */}
        <section className="sh-card p-5 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">31 Hari Ke Depan</h2>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Lega
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Sedang
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Padat
              </span>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase text-slate-400">
            {WEEKDAY_HEADERS.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((d, i) => {
              const s = daySummaries[i];
              const isSelected = i === selectedDayIdx;
              const idleRatio = rooms.length > 0 ? s.idleRooms.length / rooms.length : 0;
              const barColor =
                idleRatio >= 0.45
                  ? 'bg-emerald-500'
                  : idleRatio >= 0.25
                    ? 'bg-amber-400'
                    : 'bg-blue-500';

              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDayIdx(i)}
                  aria-label={d.label}
                  className={`flex min-h-[72px] flex-col justify-between rounded-xl border p-2 text-left transition ${
                    isSelected
                      ? 'border-brand bg-brand/5 ring-2 ring-brand/25 dark:border-brand-dark dark:bg-brand-dark/15 dark:ring-brand-dark/30'
                      : 'border-line-light bg-white hover:border-slate-300 dark:border-line-dark dark:bg-surface-subtle-dark/60 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold tabular-nums ${
                        isSelected ? 'text-brand dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {d.dayNum}
                    </span>
                    {s.withBooking.length > 0 && (
                      <span
                        title={`${s.withBooking.length} ruang dibooking`}
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                      />
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {s.idleRooms.length} lega
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.max(12, Math.round(idleRatio * 100))}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Actionable Selected Day Inspector */}
        <aside className="sh-card flex flex-col justify-between gap-4 p-5 lg:col-span-5">
          <div className="space-y-4">
            <div className="border-b border-line-light pb-3.5 dark:border-line-dark">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ringkasan Tanggal
              </div>
              <h2 className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                {activeDay.label}
                {activeDay.weekday === 0 ? ' (Minggu)' : ''}
              </h2>
            </div>

            {/* 3 Clean Numeric Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-emerald-50/80 p-3 text-center dark:bg-emerald-500/10">
                <div className="text-lg font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {activeSummary.idleRooms.length}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                  Kosong penuh
                </div>
              </div>
              <div className="rounded-xl bg-amber-50/80 p-3 text-center dark:bg-amber-500/10">
                <div className="text-lg font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
                  {activeSummary.withBooking.length}
                </div>
                <div className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300/80">
                  Dibooking
                </div>
              </div>
              <div className="rounded-xl bg-blue-50/80 p-3 text-center dark:bg-blue-500/10">
                <div className="text-lg font-extrabold tabular-nums text-blue-700 dark:text-blue-300">
                  {activeSummary.withClass.length}
                </div>
                <div className="text-[10px] font-semibold text-blue-700/80 dark:text-blue-300/80">
                  Ada kelas
                </div>
              </div>
            </div>

            {/* Segmented Tab */}
            <div className="grid grid-cols-3 rounded-xl border border-line-light bg-slate-50 p-1 dark:border-line-dark dark:bg-surface-subtle-dark">
              {[
                { id: 'idle', label: 'Kosong' },
                { id: 'booked', label: 'Dibooking' },
                { id: 'class', label: 'Ada Kelas' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPanelTab(t.id)}
                  className={`rounded-lg py-1.5 text-xs font-bold transition ${
                    panelTab === t.id
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scrollable Clean Room List */}
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {activeListCodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-light py-8 text-center text-xs text-slate-400 dark:border-line-dark">
                  Tidak ada ruangan di kategori ini.
                </div>
              ) : (
                activeListCodes.map((code) => {
                  const room = roomByCode.get(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => openRoomDetail(code, selectedDayIdx)}
                      className="flex w-full items-center justify-between rounded-xl border border-line-light px-3 py-2 text-left transition hover:border-brand/50 hover:bg-slate-50 dark:border-line-dark dark:hover:border-brand-dark/50 dark:hover:bg-slate-800/50"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{code}</div>
                        {room && (
                          <div className="text-[10px] text-slate-400">{room.location_label}</div>
                        )}
                      </div>
                      {room && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <Users className="h-3 w-3" />
                          {room.capacity}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goToFindWithDate(selectedDayIdx)}
            className="sh-btn-primary w-full"
          >
            Cari Ruang di Tanggal Ini
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
