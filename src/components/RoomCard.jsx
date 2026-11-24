import { ArrowUpRight, Star, Users } from 'lucide-react';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function RoomCard({ room, dayIndex }) {
  const { days, bookings, reports, user, isAdmin, nowWib, filters, favorites, openRoomDetail, toggleFavorite } =
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
      className="sh-card group flex cursor-pointer flex-col overflow-hidden text-left transition duration-150 hover:border-[#A8B8D8] dark:hover:border-[#344A75]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-subtle dark:bg-unnes-night-input">
        <img
          src={room.image_url}
          alt={`Ruang ${room.code}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D1A]/80 via-[#070D1A]/15 to-transparent" />

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold ${
            isFreeStart
              ? 'bg-emerald-700/95 text-white'
              : 'bg-[#070D1A]/75 text-slate-200 backdrop-blur-sm'
          }`}
        >
          {isFreeStart ? `Kosong s.d. ${formatHour(freeUntil)}` : `Terisi ${formatHour(filters.start)}`}
        </span>

        {!isAdmin && (
          <button
            type="button"
            aria-label={isFav ? `Hapus ${room.code} dari favorit` : `Simpan ${room.code} ke favorit`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(room.code);
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#070D1A]/50 text-white backdrop-blur-sm transition hover:bg-[#070D1A]/75"
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : 'text-white/90'}`} />
          </button>
        )}

        <div className="absolute inset-x-3.5 bottom-3 flex items-end justify-between text-white">
          <div>
            <h3 className="font-mono text-base font-bold leading-tight tracking-tight">{room.code}</h3>
            <span className="text-[11px] font-medium text-[#D5E0F5]">
              Gedung {room.building} · Lt. {room.floor}
            </span>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white opacity-0 transition group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-bold ${
              isPaid
                ? 'text-amber-700 dark:text-unnes-gold'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatPriceBadge(room.price_per_hour)}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#526382] dark:text-unnes-night-muted">
            <Users className="h-3.5 w-3.5" />
            {room.capacity}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 border-t border-line-light pt-2.5 dark:border-unnes-night-line">
          {(room.facilities || []).map((f) => (
            <span
              key={f}
              className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold text-[#3C4E70] dark:bg-[#192746] dark:text-[#B9C8E4]"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
