import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { START_HOURS } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import RoomCard from '../components/RoomCard';

export default function FavoritesView() {
  const { rooms, favorites, days, filters, updateFilter, navigate } = useSpaceHub();
  const favRooms = rooms.filter((r) => favorites.has(r.code));
  const hourOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
            Ruang favorit
          </h1>
          <p className="mt-1 text-[13px] tabular-nums text-[#5B667B] dark:text-[#9AA7BE]">
            {favRooms.length} ruang tersimpan.
          </p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
          />
          <SelectPopover
            label="Jam"
            icon={Clock}
            value={filters.start}
            onChange={(v) => updateFilter('start', Number(v))}
            options={hourOptions}
            align="right"
          />
        </div>
      </div>

      {favRooms.length > 0 ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {favRooms.map((r) => (
            <RoomCard key={r.code} room={r} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[15px] font-semibold text-[#141923] dark:text-[#EEF2F7]">Belum ada ruang favorit</p>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Simpan ruang yang sering dipakai agar cepat ditemukan kembali.
          </p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-5">
            Cari ruang
          </button>
        </div>
      )}
    </div>
  );
}
