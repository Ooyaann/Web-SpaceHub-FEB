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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">
            Booking saya
          </h1>
          <div className="mt-1.5">
            <BookingRulesPills />
          </div>
        </div>
        <span className="rounded-xl border border-[#DCE2EC] bg-white px-3.5 py-2 text-xs font-medium text-[#475467] shadow-sm dark:border-ink-line dark:bg-ink-card dark:text-[#B0B8C9]">
          Kuota aktif:{' '}
          <strong className="tabular-nums font-bold text-[#101828] dark:text-unnes-gold">
            {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </strong>
        </span>
      </div>

      {myBookings.length === 0 ? (
        <div className="sh-panel py-16 text-center">
          <p className="text-[15px] font-bold text-[#101828] dark:text-[#F5F7FA]">Belum ada booking</p>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Pilih ruang kosong untuk diskusi kelompok atau kegiatan kampus.
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
                className={`sh-panel flex flex-col justify-between gap-4 p-5 transition-all ${
                  isCancelled ? 'opacity-65' : 'hover:border-[#C5CEE0] dark:hover:border-ink-line-strong'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => openRoomDetail(b.room_code, 0)}
                        className="text-lg font-bold tracking-tight text-[#101828] transition-colors hover:text-unnes-navy dark:text-[#F5F7FA] dark:hover:text-unnes-gold"
                      >
                        Ruang {b.room_code}
                      </button>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            isCancelled
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-ink-line dark:bg-ink-subtle dark:text-rose-300'
                              : active
                                ? 'border-[#CBEFD9] bg-[#F2FBF6] text-[#067647] dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA]'
                                : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#667085] dark:border-ink-line dark:bg-ink-canvas dark:text-[#98A2B3]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCancelled ? 'bg-rose-500' : active ? 'bg-[#10B981]' : 'bg-[#98A2B3]'
                            }`}
                          />
                          {isCancelled ? 'Dibatalkan' : active ? 'Aktif · Disetujui' : 'Selesai'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(b.id)}
                      title="Salin kode booking"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE2EC] bg-[#F6F8FB] px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-[#101828] transition hover:border-unnes-navy active:scale-95 dark:border-ink-line-strong dark:bg-ink-subtle dark:text-unnes-gold dark:hover:border-unnes-gold"
                    >
                      {b.id}
                      {copiedId === b.id ? (
                        <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-65" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-medium text-[#344054] dark:text-[#D0D7E6]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#667085] dark:text-[#8A93A6]" />
                      {formatDateKeyLabel(b.booking_date, days)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Clock className="h-3.5 w-3.5 text-[#667085] dark:text-[#8A93A6]" />
                      {formatHourRange(b.start_hour, b.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Users className="h-3.5 w-3.5 text-[#667085] dark:text-[#8A93A6]" />
                      {b.participants} orang
                    </span>
                  </div>

                  <p className="truncate text-xs text-[#667085] dark:text-[#8A93A6]">
                    {b.purpose} · NIM <span className="font-mono tabular-nums">{b.nim}</span>
                  </p>
                </div>

                {cancellable && (
                  <div className="border-t border-[#ECEFF4] pt-3 dark:border-ink-line">
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
                          className="inline-flex h-8 items-center rounded-lg bg-[#DC2626] px-3 text-xs font-semibold text-white transition hover:bg-[#B91C1C] active:scale-95 disabled:opacity-50"
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
