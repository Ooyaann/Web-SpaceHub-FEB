import { BOOKING_RULE_PILLS } from '../lib/constants';

export default function BookingRulesPills() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BOOKING_RULE_PILLS.map((rule) => (
        <span
          key={rule}
          className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {rule}
        </span>
      ))}
    </div>
  );
}
