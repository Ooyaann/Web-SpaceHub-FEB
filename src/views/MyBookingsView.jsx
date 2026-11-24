import { useState } from 'react';
import { Calendar, Check, Clock, Copy, Trash2, Users } from 'lucide-react';
import { MAX_ACTIVE_BOOKINGS } from '../lib/constants';
import { formatDateKeyLabel, formatHourRange } from '../lib/dateWib';
import { canCancelBooking, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import BookingRulesPills from '../components/BookingRulesPills';

export default function MyBookingsView() {
  const {
    myBookings,
    myActiveBookingCount,
    days,
    nowWib,
    cancelBooking,
    openRoomDetail,
    navigate,
    showToast,
  } = useSpaceHub();

  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleConfirmCancel = async (booking) => {
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking);
      setConfirmId(null);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      showToast(`Kode ${code} disalin`, 'success');
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      showToast(`Kode: ${code}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
            Booking saya
          </h1>
          <div className="mt-1.5">
            <BookingRulesPills />
          </div>
        </div>
        <span className="text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
          Aktif:{' '}
          <strong className="tabular-nums font-semibold text-[#141923] dark:text-unnes-gold">
            {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </strong>
        </span>
      </div>

      {myBookings.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] font-semibold text-[#141923] dark:text-[#EEF2F7]">Belum ada booking</p>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Booking ruang kosong untuk diskusi kelompok atau kegiatan kampus.
          </p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-5">
            Cari ruang kosong
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {myBookings.map((b) => {
            const active = isBookingActive(b, nowWib.dateKey, nowWib.hour);
            const cancellable = canCancelBooking(b, nowWib.dateKey, nowWib.hour);
            const isCancelled = b.status === 'cancelled';

            return (
              <article
                key={b.id}
                className={`sh-panel flex flex-col justify-between gap-4 p-5 ${isCancelled ? 'opacity-65' : ''}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => openRoomDetail(b.room_code, 0)}
                        className="text-lg font-bold tracking-tight text-[#141923] hover:text-unnes-navy dark:text-[#EEF2F7] dark:hover:text-unnes-gold"
                      >
                        Ruang {b.room_code}
                      </button>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isCancelled ? 'bg-[#E11D48]' : active ? 'bg-[#22A06B]' : 'bg-[#9CA6BA]'
                          }`}
                        />
                        {isCancelled ? 'Dibatalkan' : active ? 'Aktif · Disetujui' : 'Selesai'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(b.id)}
                      title="Salin kode booking"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E6EE] bg-[#F8F9FB] px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-[#141923] transition hover:border-unnes-navy dark:border-white/[0.1] dark:bg-ink-subtle dark:text-unnes-gold dark:hover:border-unnes-gold"
                    >
                      {b.id}
                      {copiedId === b.id ? (
                        <Check className="h-3.5 w-3.5 text-[#22A06B]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#434E63] dark:text-[#C4CFE2]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#7B869B]" />
                      {formatDateKeyLabel(b.booking_date, days)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Clock className="h-3.5 w-3.5 text-[#7B869B]" />
                      {formatHourRange(b.start_hour, b.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Users className="h-3.5 w-3.5 text-[#7B869B]" />
                      {b.participants} orang
                    </span>
                  </div>

                  <p className="truncate text-xs text-[#6B768C] dark:text-[#8E9BB3]">
                    {b.purpose} · NIM <span className="font-mono tabular-nums">{b.nim}</span>
                  </p>
                </div>

                {cancellable && (
                  <div className="border-t border-[#EAECEF] pt-3 dark:border-white/[0.08]">
                    {confirmId === b.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="sh-btn-secondary h-8 px-3 text-xs"
                        >
                          Tidak
                        </button>
                        <button
                          type="button"
                          disabled={cancellingId === b.id}
                          onClick={() => handleConfirmCancel(b)}
                          className="inline-flex h-8 items-center rounded-lg bg-[#DC2626] px-3 text-xs font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-50"
                        >
                          {cancellingId === b.id ? 'Membatalkan...' : 'Ya, batalkan'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(b.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline dark:text-[#F87171]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Batalkan booking
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
