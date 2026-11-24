import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

const BAR_COLORS = {
  f: 'bg-[#a7e3bd] dark:bg-[#1f6a43]',
  k: 'bg-[#1d4ed8] dark:bg-[#5b8cff]',
  o: 'bg-[#f08a24] dark:bg-[#ff9f45]',
  m: 'bg-[#ffc72c]',
  p: 'bg-[#dbe3f3]/70 dark:bg-[#25335a]/70',
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
          return (
            <div
              key={h}
              title={`${formatHour(h)} – ${SLOT_LABELS[status]}`}
              className={`${compact ? 'h-4' : 'h-6'} rounded-[5px] transition-all ${BAR_COLORS[status]} ${
                highlighted ? 'ring-2 ring-unnes-gold ring-offset-1 ring-offset-white dark:ring-offset-unnes-card-dark' : ''
              }`}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="mt-1 grid grid-cols-10 gap-1">
          {OPERATIONAL_HOURS.map((h) => (
            <span
              key={h}
              className="text-center text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400"
            >
              {pad2(h)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
