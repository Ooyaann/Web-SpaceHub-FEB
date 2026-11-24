import { START_HOURS } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { useSpaceHub } from '../context/SpaceHubContext';
import RoomCard from '../components/RoomCard';

export default function FavoritesView() {
  const { rooms, favorites, days, filters, updateFilter, navigate } = useSpaceHub();
  const favRooms = rooms.filter((r) => favorites.has(r.code));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Ruangan Favorit</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Daftar ruangan yang sering kamu gunakan, lengkap dengan status ketersediaan pada waktu yang dipilih.
        </p>
      </div>

      <div className="grid max-w-md grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tanggal</span>
          <select
            value={filters.day}
            onChange={(e) => updateFilter('day', Number(e.target.value))}
            className="sh-input"
          >
            {days.map((d) => (
              <option key={d.key} value={d.index}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam Mulai</span>
          <select
            value={filters.start}
            onChange={(e) => updateFilter('start', Number(e.target.value))}
            className="sh-input"
          >
            {START_HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)} WIB
              </option>
            ))}
          </select>
        </label>
      </div>

      {favRooms.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {favRooms.map((r) => (
            <RoomCard key={r.code} room={r} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <p className="text-sm font-bold text-[#0f1d3d] dark:text-white">Belum ada ruangan favorit.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ketuk ikon bintang pada kartu ruang atau halaman detail untuk menyimpannya di sini.
          </p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-4">
            Jelajahi Ruangan
          </button>
        </div>
      )}
    </div>
  );
}
