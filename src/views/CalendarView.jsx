import { useMemo, useState } from 'react';
import { getDaySummary } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function CalendarView() {
  const { rooms, bookings, reports, user, days, openRoomDetail } = useSpaceHub();
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

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

  const renderGroup = (title, list, dotClass) => (
    <div className="sh-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0f1d3d] dark:text-white">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        {title} ({list.length})
      </h3>
      {list.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {list.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => openRoomDetail(code, selectedDayIdx)}
              className="rounded-lg bg-[#e6eeff] px-2.5 py-1 text-[11px] font-bold text-unnes-blue transition hover:bg-unnes-gold hover:text-unnes-gold-ink dark:bg-[#1c2a52] dark:text-unnes-blue-light dark:hover:bg-unnes-gold dark:hover:text-unnes-gold-ink"
            >
              {code}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tidak ada ruangan di kategori ini.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Kalender Kelas (31 Hari)</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {days[0].shortDate} sampai {days[days.length - 1].shortDate}. Jadwal kuliah adalah data contoh, sedangkan
          booking & laporan terpakai berasal dari server.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-unnes-blue dark:bg-unnes-blue-light" />
          Ada kelas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f08a24]" />
          Dibooking / terpakai
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#43b574]" />
          Kosong seharian
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_HEADERS.map((wd) => (
          <div
            key={wd}
            className="pb-1 text-center text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400"
          >
            {wd}
          </div>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((d, i) => {
          const s = daySummaries[i];
          const isSelected = i === selectedDayIdx;
          const isWeekend = d.weekday === 0 || d.weekday === 6;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setSelectedDayIdx(i)}
              aria-label={d.label}
              className={`flex min-h-[68px] flex-col gap-0.5 rounded-xl border p-1.5 text-left text-[11px] transition sm:min-h-[78px] sm:p-2 ${
                isSelected
                  ? 'border-unnes-gold bg-white ring-2 ring-unnes-gold dark:bg-unnes-card-dark'
                  : isWeekend
                    ? 'border-unnes-border bg-[#e6eeff]/60 dark:border-unnes-border-dark dark:bg-[#172344]'
                    : 'border-unnes-border bg-white hover:border-unnes-blue/50 dark:border-unnes-border-dark dark:bg-unnes-card-dark'
              }`}
            >
              <span className="text-xs font-extrabold text-[#0f1d3d] dark:text-white">{d.dayNum}</span>
              <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-unnes-blue dark:bg-unnes-blue-light" />
                {s.withClass.length}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#f08a24]" />
                {s.withBooking.length}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#43b574]" />
                {s.idleRooms.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-extrabold text-[#0f1d3d] dark:text-white">
          Detail {activeDay.label}
          {activeDay.weekday === 0 ? ' (Hari Minggu — tidak ada jadwal kuliah)' : ''}
        </h3>
        {renderGroup('Ruang Dibooking / Dilaporkan Terpakai', activeSummary.withBooking, 'bg-[#f08a24]')}
        {renderGroup('Ruang Ada Kelas (Contoh)', activeSummary.withClass, 'bg-unnes-blue dark:bg-unnes-blue-light')}
        {renderGroup('Ruang Kosong Seharian', activeSummary.idleRooms, 'bg-[#43b574]')}
      </div>
    </div>
  );
}
