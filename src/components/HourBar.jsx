import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

const BAR_COLORS = {
  f: 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/45',
  k: 'bg-blue-100 border border-blue-200 dark:bg-[#25458A]/55 dark:border-[#3A65BF]/60',
  o: 'bg-amber-100 border border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/45',
  m: 'bg-unnes-gold/75 border border-unnes-gold dark:bg-unnes-gold/80 dark:border-unnes-gold',
  p: 'bg-slate-100 border border-slate-200/80 dark:bg-[#17223B] dark:border-[#223152]',
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
      <div className="grid grid-cols-10 gap-1">
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

          const baseClass = `${compact ? 'h-5' : 'h-7'} rounded-[5px] transition ${BAR_COLORS[status]} ${
            highlighted
              ? 'ring-2 ring-unnes-royal ring-offset-1 ring-offset-white dark:ring-unnes-gold dark:ring-offset-unnes-night-card'
              : ''
          }`;

          if (clickable) {
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelectHour(h)}
                title={`Klik untuk booking ${formatHour(h)}`}
                className={`${baseClass} cursor-pointer hover:border-emerald-600 hover:bg-emerald-200 dark:hover:border-emerald-300 dark:hover:bg-emerald-500/35`}
              />
            );
          }

          return <div key={h} title={`${formatHour(h)} · ${SLOT_LABELS[status]}`} className={baseClass} />;
        })}
      </div>
      {showLabels && (
        <div className="mt-1.5 grid grid-cols-10 gap-1">
          {OPERATIONAL_HOURS.map((h) => (
            <span
              key={h}
              className="text-center font-mono text-[10px] font-medium tabular-nums text-[#6A7B9C] dark:text-[#6E82AA]"
            >
              {pad2(h)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
