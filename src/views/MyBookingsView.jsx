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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Booking Saya</h1>
          <div className="mt-2">
            <BookingRulesPills />
          </div>
        </div>
        <div className="rounded-xl border border-line-light bg-white px-3.5 py-2 text-xs font-bold text-slate-700 dark:border-line-dark dark:bg-surface-dark dark:text-slate-200">
          Aktif:{' '}
          <span className="text-brand dark:text-blue-400">
            {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </span>
        </div>
      </div>

      {myBookings.length === 0 ? (
        <div className="sh-card border-dashed px-6 py-14 text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Belum ada booking.</p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-4">
            Cari Ruang Kosong
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myBookings.map((b) => {
            const active = isBookingActive(b, nowWib.dateKey, nowWib.hour);
            const cancellable = canCancelBooking(b, nowWib.dateKey, nowWib.hour);
            const isCancelled = b.status === 'cancelled';

            return (
              <article
                key={b.id}
                className={`sh-card flex flex-col justify-between gap-4 p-5 ${isCancelled ? 'opacity-65' : ''}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => openRoomDetail(b.room_code, 0)}
                        className="text-lg font-extrabold leading-tight text-slate-900 hover:text-brand dark:text-white dark:hover:text-blue-400"
                      >
                        {b.room_code}
                      </button>
                      <div className="mt-1">
                        {isCancelled ? (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                            Dibatalkan
                          </span>
                        ) : active ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            Aktif · Disetujui
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Selesai
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(b.id)}
                      title="Salin kode booking"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line-light bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700 transition hover:border-brand hover:text-brand dark:border-line-dark dark:bg-surface-subtle-dark dark:text-slate-200 dark:hover:border-brand-dark"
                    >
                      {b.id}
                      {copiedId === b.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDateKeyLabel(b.booking_date, days)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatHourRange(b.start_hour, b.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {b.participants} orang
                    </span>
                  </div>

                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {b.purpose} · NIM {b.nim}
                  </div>
                </div>

                {cancellable && (
                  <div className="border-t border-line-light pt-3 dark:border-line-dark">
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
                          className="inline-flex h-8 items-center rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {cancellingId === b.id ? 'Membatalkan...' : 'Ya, Batalkan'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(b.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
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
