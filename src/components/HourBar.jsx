import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotStatus } from '../lib/schedule';

/* Crisp high-contrast neutral/brand slot styling — NO murky dark-green backgrounds */
const BAR_STYLES = {
  f: 'border border-[#CFE8DA] bg-white text-[#067647] dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA]',
  k: 'border border-[#DCE2EC] bg-[#EBEEF4] text-[#667085] dark:border-ink-line dark:bg-[#181B22] dark:text-[#7F889B]',
  o: 'border border-[#FCD34D]/60 bg-[#FEF3C7] text-[#92400E] dark:border-[#4D3D22] dark:bg-[#2B2418] dark:text-[#FBBF24]',
  m: 'border border-unnes-gold bg-unnes-gold font-bold text-unnes-gold-ink',
  p: 'border border-transparent bg-[#F1F3F7] text-[#A0AAB8] dark:bg-[#14171D] dark:text-[#4F5769]',
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

          const baseClass = `relative flex ${compact ? 'h-6' : 'h-9'} items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-all duration-150 ${BAR_STYLES[status]} ${
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
                title={`Klik untuk booking mulai ${formatHour(h)}`}
                className={`${baseClass} cursor-pointer hover:-translate-y-0.5 hover:border-unnes-navy hover:bg-unnes-navy hover:text-white active:scale-95 dark:hover:border-unnes-gold dark:hover:bg-unnes-gold dark:hover:text-unnes-gold-ink`}
              >
                {showLabels ? pad2(h) : ''}
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              </button>
            );
          }

          return (
            <div key={h} title={`${formatHour(h)} · ${SLOT_LABELS[status]}`} className={baseClass}>
              {showLabels ? pad2(h) : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
