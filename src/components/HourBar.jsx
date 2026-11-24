import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

const BAR_COLORS = {
  f: 'bg-[#7fdca2] dark:bg-[#237a4d]',
  k: 'bg-[#2563eb] dark:bg-[#5b8cff]',
  o: 'bg-[#f59e0b] dark:bg-[#ff9f45]',
  m: 'bg-[#ffc72c]',
  p: 'bg-[#dbe3f3]/75 dark:bg-[#25335a]/75',
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

          const baseClass = `${compact ? 'h-4' : 'h-7'} rounded-md transition-all ${BAR_COLORS[status]} ${
            highlighted ? 'ring-2 ring-unnes-gold ring-offset-1 ring-offset-white dark:ring-offset-unnes-card-dark' : ''
          }`;

          if (clickable) {
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelectHour(h)}
                title={`Klik untuk booking jam ${formatHour(h)}`}
                className={`${baseClass} cursor-pointer hover:-translate-y-0.5 hover:brightness-95 focus:ring-2 focus:ring-unnes-navy`}
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
        <div className="mt-1 grid grid-cols-10 gap-1">
          {OPERATIONAL_HOURS.map((h) => (
            <span
              key={h}
              className="text-center text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400"
            >
              {pad2(h)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
