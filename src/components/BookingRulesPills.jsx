import { BOOKING_RULE_PILLS } from '../lib/constants';

export default function BookingRulesPills() {
  return (
    <p className="text-xs text-[#6B768C] dark:text-[#8E9BB3]">
      {BOOKING_RULE_PILLS.join(' · ')}
    </p>
  );
}
