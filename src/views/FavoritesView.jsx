import { START_HOURS } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import RoomCard from '../components/RoomCard';

export default function FavoritesView() {
  const { rooms, favorites, days, filters, updateFilter, navigate } = useSpaceHub();
  const favRooms = rooms.filter((r) => favorites.has(r.code));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Ruang Favorit</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{favRooms.length} ruang tersimpan.</p>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-2.5">
          <DatePickerPopover
            label="Tanggal"
            days={days}
            value={filters.day}
            onChange={(idx) => updateFilter('day', idx)}
          />
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam</span>
            <select
              value={filters.start}
              onChange={(e) => updateFilter('start', Number(e.target.value))}
              className="sh-input font-semibold"
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {favRooms.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favRooms.map((r) => (
            <RoomCard key={r.code} room={r} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <p className="text-sm font-bold">Belum ada favorit.</p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-4">
            Cari Ruang
          </button>
        </div>
      )}
    </div>
  );
}
