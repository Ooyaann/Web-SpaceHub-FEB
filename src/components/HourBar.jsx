import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

const BAR_COLORS = {
  f: 'bg-emerald-100 border border-emerald-300/80 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300',
  k: 'bg-blue-100/90 border border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/35 dark:text-blue-300',
  o: 'bg-amber-100/90 border border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/35 dark:text-amber-300',
  m: 'bg-yellow-200 border border-yellow-400 text-yellow-900 dark:bg-yellow-500/35 dark:border-yellow-400/60 dark:text-yellow-200',
  p: 'bg-slate-100 border border-slate-200/70 text-slate-400 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-600',
};

export default function HourBar({
  roomCode,
  dateKey,
  weekday,
  bookings,
  reports,
  userEmail,
  todayWib,
  nowHourWib,
  highlightStart = -1,
  highlightDur = 0,
  showLabels = true,
  compact = false,
  onSelectHour = null,
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-10 gap-1.5">
        {OPERATIONAL_HOURS.map((h) => {
          const status = getSlotStatus({
            roomCode,
            dateKey,
            weekday,
            hour: h,
            bookings,
            reports,
            userEmail,
            todayWib,
            nowHourWib,
          });
          const highlighted = highlightStart >= 0 && h >= highlightStart && h < highlightStart + highlightDur;
          const clickable = Boolean(onSelectHour) && status === 'f' && h <= 15;

          const baseClass = `${compact ? 'h-6' : 'h-8'} rounded-lg transition-all ${BAR_COLORS[status]} ${
            highlighted
              ? 'ring-2 ring-brand ring-offset-1 ring-offset-white dark:ring-brand-dark dark:ring-offset-surface-dark'
              : ''
          }`;

          if (clickable) {
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelectHour(h)}
                title={`Klik untuk booking jam ${formatHour(h)}`}
                className={`${baseClass} cursor-pointer hover:border-emerald-500 hover:bg-emerald-200/80 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/35`}
              />
            );
          }

          return (
            <div
              key={h}
              title={`${formatHour(h)} · ${SLOT_LABELS[status]}`}
              className={baseClass}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="mt-1.5 grid grid-cols-10 gap-1.5">
          {OPERATIONAL_HOURS.map((h) => (
            <span
              key={h}
              className="text-center text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500"
            >
              {pad2(h)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
