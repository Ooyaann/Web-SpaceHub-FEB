import { Star } from 'lucide-react';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

/**
 * RoomCard — Gaya Airbnb/PeerSpace yang bersih:
 * - Foto 100% utuh tanpa teks/gradient menutupi gambar.
 * - Tipografi tenang & rapi di bawah foto, fasilitas dipisah middot (tanpa spam kotak pill).
 */
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
      className="group flex cursor-pointer flex-col text-left"
    >
      {/* Foto Bersih 100% (tanpa teks / scrim hitam) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#EEF0F4] dark:bg-ink-card">
        <img
          src={room.image_url}
          alt={`Ruang ${room.code}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        {!isAdmin && (
          <button
            type="button"
            aria-label={isFav ? `Hapus ${room.code} dari favorit` : `Simpan ${room.code} ke favorit`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(room.code);
            }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#141923] shadow-sm transition hover:scale-105 hover:bg-white dark:bg-ink-rail/85 dark:text-[#EEF2F7]"
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : ''}`} />
          </button>
        )}
      </div>

      {/* Konten Tipografi Bersih di Bawah Foto */}
      <div className="mt-3 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-bold tracking-tight text-[#141923] group-hover:text-unnes-navy dark:text-[#EEF2F7] dark:group-hover:text-unnes-gold">
            {room.code}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E384D] dark:text-[#C8D2E3]">
            <span
              className={`h-2 w-2 rounded-full ${isFreeStart ? 'bg-[#22A06B]' : 'bg-[#9CA6BA]'}`}
            />
            {isFreeStart ? `Kosong s.d. ${formatHour(freeUntil)}` : `Terisi ${formatHour(filters.start)}`}
          </span>
        </div>

        <p className="text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
          Gedung {room.building} · Lantai {room.floor} · {room.capacity} kursi
        </p>

        <p className="truncate text-xs text-[#7B869B] dark:text-[#7E8CA6]">
          {(room.facilities || []).join(' · ')}
        </p>

        <div className="pt-1 text-[13px] font-semibold text-[#141923] dark:text-[#EEF2F7]">
          <span className={isPaid ? 'text-[#9A5B00] dark:text-unnes-gold' : ''}>
            {formatPriceBadge(room.price_per_hour)}
          </span>
        </div>
      </div>
    </article>
  );
}
