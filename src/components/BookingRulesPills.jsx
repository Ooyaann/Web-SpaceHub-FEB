import { MAX_ACTIVE_BOOKINGS } from '../lib/constants';

export default function BookingRulesPills() {
  return (
    <p className="text-xs font-medium text-[#667085] dark:text-[#8A93A6]">
      Maks. {MAX_ACTIVE_BOOKINGS} booking aktif · Durasi 1–3 jam · Operasional 07.00–17.00 WIB · Otomatis disetujui
    </p>
  );
}
