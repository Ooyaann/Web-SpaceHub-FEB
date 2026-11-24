import { useState } from 'react';
import { Calendar, Clock, Hash, Trash2, Users } from 'lucide-react';
import { BOOKING_RULES_TEXT, MAX_ACTIVE_BOOKINGS } from '../lib/constants';
import { formatDateKeyLabel, formatHourRange } from '../lib/dateWib';
import { canCancelBooking, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function MyBookingsView() {
  const {
    myBookings,
    myActiveBookingCount,
    days,
    nowWib,
    cancelBooking,
    openRoomDetail,
    navigate,
  } = useSpaceHub();

  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleConfirmCancel = async (booking) => {
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking);
      setConfirmId(null);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Booking Saya</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{BOOKING_RULES_TEXT}</p>
        </div>
        <div className="rounded-xl bg-unnes-navy px-3.5 py-2 text-xs font-bold text-white dark:bg-[#192852]">
          Booking aktif: <span className="text-unnes-gold">{myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}</span>
        </div>
      </div>

      {myBookings.length === 0 ? (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <p className="text-sm font-bold text-[#0f1d3d] dark:text-white">Belum ada riwayat booking ruang.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Buka menu Cari Ruang, pilih ruangan kosong, lalu tekan Booking Ruang.
          </p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-4">
            Cari Ruang Kosong
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myBookings.map((b) => {
            const active = isBookingActive(b, nowWib.dateKey, nowWib.hour);
            const cancellable = canCancelBooking(b, nowWib.dateKey, nowWib.hour);
            const isCancelled = b.status === 'cancelled';

            return (
              <article
                key={b.id}
                className={`sh-card flex flex-wrap items-center justify-between gap-4 p-4 ${
                  isCancelled ? 'opacity-65' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRoomDetail(b.room_code, 0)}
                      className="text-base font-extrabold text-[#0f1d3d] hover:text-unnes-blue dark:text-white dark:hover:text-unnes-blue-light"
                    >
                      {b.room_code}
                    </button>

                    {isCancelled ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                        Dibatalkan
                      </span>
                    ) : active ? (
                      <span className="rounded-full bg-unnes-gold px-2.5 py-0.5 text-[11px] font-extrabold text-unnes-gold-ink">
                        Disetujui Otomatis
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Selesai
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-md bg-[#e6eeff] px-2 py-0.5 font-mono text-[11px] font-bold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light">
                      <Hash className="h-3 w-3" />
                      {b.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                      {formatDateKeyLabel(b.booking_date, days)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                      {formatHourRange(b.start_hour, b.duration)} WIB ({b.duration} jam)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                      {b.participants} orang
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keperluan: <strong className="text-slate-700 dark:text-slate-200">{b.purpose}</strong> · NIM{' '}
                    {b.nim}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {cancellable ? (
                    confirmId === b.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={cancellingId === b.id}
                          onClick={() => handleConfirmCancel(b)}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        >
                          {cancellingId === b.id ? 'Membatalkan...' : 'Ya, Batalkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="sh-btn-secondary py-2 text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(b.id)}
                        className="sh-btn-secondary border-rose-200 py-2 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Batalkan Booking
                      </button>
                    )
                  ) : (
                    !isCancelled && (
                      <span className="text-[11px] font-medium text-slate-400">
                        Tidak bisa dibatalkan (sudah dimulai/selesai)
                      </span>
                    )
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
