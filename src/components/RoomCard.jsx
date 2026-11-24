import { ArrowUpRight, Star, Tag, Users } from 'lucide-react';
import { formatHour, formatPriceBadge } from '../lib/dateWib';
import { getFreeUntilHour } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

/**
 * RoomCard — Kartu ruang taktil bergaya produk komersial modern:
 * - Memiliki bingkai kartu nyata, elevasi halus, dan animasi hover lift.
 * - Status menggunakan lencana netral bersih + dot solid (tanpa warna hijau kusam di dark mode).
 * - Label tarif ("Gratis Mahasiswa FEB" / "Rp 50.000/jam") tampil jelas dengan background seperti badge/button.
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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E3E7EF] bg-white text-left shadow-card transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#C5CEE0] hover:shadow-card-hover active:scale-[0.99] dark:border-ink-line dark:bg-ink-card dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] dark:hover:border-ink-line-strong dark:hover:shadow-[0_14px_32px_-8px_rgba(0,0,0,0.6)]"
    >
      {/* Foto Ruangan */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAEEF4] dark:bg-ink-subtle">
        <img
          src={room.image_url}
          alt={`Ruang ${room.code}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#101828] shadow-sm backdrop-blur-sm dark:border dark:border-white/10 dark:bg-ink-rail/90 dark:text-[#F5F7FA]">
          Gedung {room.building} · Lt. {room.floor}
        </span>

        {!isAdmin && (
          <button
            type="button"
            aria-label={isFav ? `Hapus ${room.code} dari favorit` : `Simpan ${room.code} ke favorit`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(room.code);
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#101828] shadow-sm backdrop-blur-sm transition-transform duration-150 hover:scale-105 active:scale-90 dark:border dark:border-white/10 dark:bg-ink-rail/90 dark:text-[#F5F7FA]"
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : ''}`} />
          </button>
        )}
      </div>

      {/* Isi Kartu */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#101828] transition-colors group-hover:text-unnes-navy dark:text-[#F5F7FA] dark:group-hover:text-unnes-gold">
              {room.code}
            </h3>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                isFreeStart
                  ? 'border-[#CBEFD9] bg-[#F2FBF6] text-[#067647] dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA]'
                  : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#667085] dark:border-ink-line dark:bg-ink-canvas dark:text-[#98A2B3]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isFreeStart ? 'bg-[#10B981]' : 'bg-[#98A2B3]'}`} />
              {isFreeStart ? `Kosong s.d. ${formatHour(freeUntil)}` : `Terisi ${formatHour(filters.start)}`}
            </span>
          </div>

          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
            <Users className="h-3.5 w-3.5 text-[#667085] dark:text-[#8A93A6]" />
            Kapasitas {room.capacity} kursi
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(room.facilities || []).map((fac) => (
              <span
                key={fac}
                className="rounded-md bg-[#F2F4F8] px-2 py-0.5 text-[11px] font-medium text-[#475467] dark:bg-ink-subtle dark:text-[#B8C0D2]"
              >
                {fac}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Kartu: Label Tarif berbentuk Button/Badge + Tombol Detail */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#ECEFF4] pt-3.5 dark:border-ink-line">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
              isPaid
                ? 'border-[#FDE68A] bg-[#FEF8E6] text-[#92400E] dark:border-unnes-gold/35 dark:bg-[#2F2817] dark:text-unnes-gold'
                : 'border-[#D5E0F6] bg-[#EEF3FC] text-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F0F3F8]'
            }`}
          >
            <Tag className="h-3 w-3 opacity-80" />
            {formatPriceBadge(room.price_per_hour)}
          </span>

          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2F4F8] px-2.5 py-1.5 text-xs font-semibold text-[#1E2636] transition-colors group-hover:bg-unnes-navy group-hover:text-white dark:bg-ink-subtle dark:text-[#E5EAF5] dark:group-hover:bg-unnes-gold dark:group-hover:text-unnes-gold-ink">
            Pilih
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
