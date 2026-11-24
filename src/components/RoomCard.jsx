import { MapPin, Star, Tag, Users } from 'lucide-react';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function RoomCard({ room, dayIndex }) {
  const { days, bookings, reports, user, nowWib, filters, favorites, openRoomDetail, toggleFavorite } =
    useSpaceHub();

  const targetDayIdx = dayIndex ?? filters.day;
  const targetDay = days[targetDayIdx] || days[0];
  const freeUntil = getFreeUntilHour({
    roomCode: room.code,
    dateKey: targetDay.key,
    weekday: targetDay.weekday,
    startHour: filters.start,
    bookings,
    reports,
    userEmail: user?.email,
    todayWib: nowWib.dateKey,
    nowHourWib: nowWib.hour,
  });

  const isFav = favorites.has(room.code);
  const isFreeStart = freeUntil > filters.start;
  const isPaid = Number(room.price_per_hour) > 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => openRoomDetail(room.code, targetDayIdx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRoomDetail(room.code, targetDayIdx);
        }
      }}
      className="sh-card group relative flex cursor-pointer gap-3.5 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-unnes-blue hover:shadow-soft dark:hover:border-unnes-blue-light"
    >
      <img
        src={room.image_url}
        alt={`Ruang ${room.code}`}
        loading="lazy"
        className="h-24 w-24 flex-none rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
      />

      <div className="min-w-0 flex-1 pr-7">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-extrabold tracking-tight text-[#0f1d3d] group-hover:text-unnes-blue dark:text-white dark:group-hover:text-unnes-blue-light">
            {room.code}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPaid
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
            }`}
          >
            <Tag className="h-2.5 w-2.5" />
            {formatPriceBadge(room.price_per_hour)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {room.capacity} orang
          </span>
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 flex-none" />
            {room.location_label}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {(room.facilities || []).map((f) => (
            <span
              key={f}
              className="rounded-md bg-[#e6eeff] px-1.5 py-0.5 text-[10px] font-semibold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="mt-2.5">
          {isFreeStart ? (
            <span className="inline-block rounded-full bg-unnes-gold px-2.5 py-0.5 text-[11px] font-extrabold text-unnes-gold-ink">
              Kosong sampai {formatHour(freeUntil)}
            </span>
          ) : (
            <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Terisi di jam {formatHour(filters.start)}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={isFav ? `Hapus ${room.code} dari favorit` : `Simpan ${room.code} ke favorit`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(room.code);
        }}
        className={`absolute right-2.5 top-2.5 rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
          isFav ? 'text-unnes-gold' : 'text-slate-400 hover:text-unnes-gold'
        }`}
      >
        <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold' : ''}`} />
      </button>
    </article>
  );
}
