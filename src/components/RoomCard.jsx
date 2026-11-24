import { ArrowUpRight, Star, Tag, Users } from 'lucide-react';
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
      className="sh-card group flex cursor-pointer flex-col overflow-hidden text-left transition duration-200 hover:-translate-y-1 hover:border-unnes-blue/60 hover:shadow-soft dark:hover:border-unnes-blue-light/60"
    >
      {/* Visual Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img
          src={room.image_url}
          alt={`Ruang ${room.code}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Status Pill */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${
            isFreeStart
              ? 'bg-unnes-gold text-unnes-gold-ink'
              : 'bg-black/60 text-white backdrop-blur-md'
          }`}
        >
          {isFreeStart ? `Kosong s.d. ${formatHour(freeUntil)}` : `Terisi ${formatHour(filters.start)}`}
        </span>

        {/* Favorite Glass Button */}
        <button
          type="button"
          aria-label={isFav ? `Hapus ${room.code} dari favorit` : `Simpan ${room.code} ke favorit`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(room.code);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : 'text-white'}`} />
        </button>

        {/* Bottom overlay: Room Code + Location */}
        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between text-white">
          <div>
            <h3 className="text-lg font-extrabold leading-tight tracking-tight drop-shadow-sm">
              {room.code}
            </h3>
            <span className="text-[11px] font-medium text-white/85">
              Gedung {room.building} · Lt. {room.floor}
            </span>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Concise Body */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
              isPaid
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
            }`}
          >
            <Tag className="h-3 w-3" />
            {formatPriceBadge(room.price_per_hour)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
            {room.capacity}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {(room.facilities || []).map((f) => (
            <span
              key={f}
              className="rounded-md bg-unnes-surface px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-[#1a274c] dark:text-blue-200"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
