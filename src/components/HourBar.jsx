import { CheckCircle2, Clock, GraduationCap, Plus, Users } from 'lucide-react';
import { OPERATIONAL_HOURS, SLOT_LABELS } from '../lib/constants';
import { formatHour, pad2 } from '../lib/dateWib';
import { getSlotDetail } from '../lib/schedule';

const BAR_STYLES = {
  f: 'border border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/45 dark:bg-[#14532D] dark:text-[#ECFDF5]',
  k: 'border border-[#93C5FD] bg-[#DBEAFE] text-[#1E40AF] dark:border-[#60A5FA]/40 dark:bg-[#1E3A8A]/80 dark:text-[#DBEAFE]',
  o: 'border border-[#FDBA74] bg-[#FFEDD5] text-[#9A3412] dark:border-[#FB923C]/45 dark:bg-[#7C2D12]/85 dark:text-[#FFEDD5]',
  m: 'border border-[#D99B00] bg-unnes-gold font-bold text-unnes-gold-ink shadow-sm',
  p: 'border border-[#E2E6EE] bg-[#F1F3F7] text-[#98A2B3] dark:border-ink-line/60 dark:bg-[#181B22] dark:text-[#586175]',
};

const STATUS_ICONS = {
  f: Plus,
  k: GraduationCap,
  o: Users,
  m: CheckCircle2,
  p: Clock,
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
          const isPast = dateKey === todayWib && h < nowHourWib;
          const detail = getSlotDetail({
            roomCode,
            dateKey,
            weekday,
            hour: h,
            bookings,
            reports,
            userEmail,
          });
          const status = isPast ? 'p' : detail.status;
          const Icon = STATUS_ICONS[status];
          const highlighted = highlightStart >= 0 && h >= highlightStart && h < highlightStart + highlightDur;
          const clickable = Boolean(onSelectHour) && status === 'f' && h <= 16;

          const extraTooltip =
            status === 'o' && detail.booking
              ? ` (${detail.booking.user_name}: ${detail.booking.purpose})`
              : status === 'o' && detail.report
                ? ' (Dilaporkan sedang terpakai)'
                : status === 'm' && detail.booking
                  ? ` (${detail.booking.id} · ${detail.booking.purpose})`
                  : '';

          const baseClass = `flex flex-col ${compact ? 'h-8' : 'h-11'} items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold tabular-nums transition-all duration-150 ${BAR_STYLES[status]} ${
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
                className={`${baseClass} cursor-pointer hover:-translate-y-0.5 hover:border-[#16A34A] hover:bg-[#16A34A] hover:text-white active:scale-95 dark:hover:border-[#22C55E] dark:hover:bg-[#22C55E] dark:hover:text-[#052E16]`}
              >
                <Icon className="h-3 w-3 stroke-[2.5]" />
                {showLabels && <span>{pad2(h)}</span>}
              </button>
            );
          }

          return (
            <div
              key={h}
              title={`${formatHour(h)} · ${SLOT_LABELS[status]}${extraTooltip}`}
              className={baseClass}
            >
              <Icon className="h-3 w-3 opacity-85" />
              {showLabels && <span>{pad2(h)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
