import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

/* Solid, opaque, low-chroma colors — ZERO translucent neon borders */
const BAR_COLORS = {
  f: 'bg-[#DFF3E8] dark:bg-[#1E3B30]',
  k: 'bg-[#E3ECFC] dark:bg-[#233252]',
  o: 'bg-[#FCECD7] dark:bg-[#3B2E20]',
  m: 'bg-[#FDEBA3] dark:bg-[#473B1A]',
  p: 'bg-[#F0F2F6] dark:bg-[#1D2331]',
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

          const baseClass = `${compact ? 'h-5' : 'h-7'} rounded-md transition ${BAR_COLORS[status]} ${
            highlighted
              ? 'ring-2 ring-unnes-navy ring-offset-1 ring-offset-white dark:ring-unnes-gold dark:ring-offset-ink-card'
              : ''
          }`;

          if (clickable) {
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelectHour(h)}
                title={`Booking mulai ${formatHour(h)}`}
                className={`${baseClass} cursor-pointer hover:bg-[#BFE7D2] dark:hover:bg-[#295242]`}
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
              className="text-center text-[11px] font-medium tabular-nums text-[#7B869B] dark:text-[#7E8CA6]"
            >
              {pad2(h)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
