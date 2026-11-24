import { BOOKING_RULE_PILLS } from '../lib/constants';

export default function BookingRulesPills() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BOOKING_RULE_PILLS.map((rule) => (
        <span
          key={rule}
          className="rounded-md border border-line-light bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-[#3C4E70] dark:border-unnes-night-line dark:bg-unnes-night-input dark:text-unnes-night-muted"
        >
          {rule}
        </span>
      ))}
    </div>
  );
}
