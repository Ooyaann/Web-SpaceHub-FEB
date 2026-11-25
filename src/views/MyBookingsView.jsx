import { useMemo, useState } from 'react';
import { ArrowUpRight, Calendar, Check, Clock, Copy, Trash2, Users } from 'lucide-react';
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

  const [tab, setTab] = useState('all'); // 'all' | 'active' | 'history'
  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filteredList = useMemo(() => {
    if (tab === 'active') {
      return myBookings.filter((b) => isBookingActive(b, nowWib.dateKey, nowWib.hour));
    }
    if (tab === 'history') {
      return myBookings.filter((b) => !isBookingActive(b, nowWib.dateKey, nowWib.hour));
    }
    return myBookings;
  }, [myBookings, tab, nowWib]);

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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header — Responsif penuh di Smartphone */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 sm:block">
            <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
              Booking saya
            </h1>
            <span className="inline-flex flex-none items-center gap-1 rounded-xl border border-[#DCE2EC] bg-white px-2.5 py-1 text-xs font-medium text-[#475467] shadow-sm sm:hidden dark:border-ink-line dark:bg-ink-card dark:text-[#B0B8C9]">
              Kuota{' '}
              <strong className="tabular-nums font-bold text-[#101828] dark:text-unnes-gold">
                {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
              </strong>
            </span>
          </div>
          <div className="mt-1">
            <BookingRulesPills />
          </div>
        </div>

        <span className="hidden flex-none rounded-xl border border-[#DCE2EC] bg-white px-3.5 py-2 text-xs font-medium text-[#475467] shadow-sm sm:inline-block dark:border-ink-line dark:bg-ink-card dark:text-[#B0B8C9]">
          Kuota aktif:{' '}
          <strong className="tabular-nums font-bold text-[#101828] dark:text-unnes-gold">
            {myActiveBookingCount}/{MAX_ACTIVE_BOOKINGS}
          </strong>
        </span>
      </div>

      {/* Filter Tab Ringkas */}
      {myBookings.length > 0 && (
        <div className="grid w-full grid-cols-3 rounded-xl border border-[#DCE2EC] bg-[#EEF1F6] p-1 sm:max-w-xs dark:border-ink-line dark:bg-ink-card">
          {[
            { id: 'all', label: `Semua (${myBookings.length})` },
            { id: 'active', label: `Aktif (${myActiveBookingCount})` },
            { id: 'history', label: `Riwayat (${myBookings.length - myActiveBookingCount})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white text-[#101828] shadow-sm dark:bg-ink-subtle dark:text-[#F5F7FA]'
                  : 'text-[#475467] dark:text-[#B0B8C9]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className="sh-panel px-4 py-12 text-center sm:py-16">
          <p className="text-[15px] font-bold text-[#101828] dark:text-[#F5F7FA]">
            {myBookings.length === 0 ? 'Belum ada booking' : 'Tidak ada booking di kategori ini'}
          </p>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Pilih ruang kosong untuk diskusi kelompok atau kegiatan kampus.
          </p>
          <button type="button" onClick={() => navigate('find')} className="sh-btn-primary mt-5">
            Cari ruang kosong
          </button>
        </div>
      ) : (
        /* grid-cols-1 memastikan minmax(0, 1fr) agar kartu TIDAK pernah melebar keluar layar HP */
        <div className="grid grid-cols-1 gap-3.5 sm:gap-5 md:grid-cols-2">
          {filteredList.map((b) => {
            const active = isBookingActive(b, nowWib.dateKey, nowWib.hour);
            const cancellable = canCancelBooking(b, nowWib.dateKey, nowWib.hour);
            const isCancelled = b.status === 'cancelled';

            return (
              <article
                key={b.id}
                className={`sh-panel flex min-w-0 flex-col justify-between gap-3.5 overflow-hidden p-4 transition-all sm:gap-4 sm:p-5 ${
                  isCancelled ? 'opacity-70' : 'hover:border-[#C5CEE0] dark:hover:border-ink-line-strong'
                }`}
              >
                <div className="min-w-0 space-y-3">
                  {/* Top Row: Room Code + Status + Copy Code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openRoomDetail(b.room_code, 0)}
                        className="inline-flex items-center gap-1 text-base font-bold tracking-tight text-[#101828] transition-colors hover:text-unnes-navy sm:text-lg dark:text-[#F5F7FA] dark:hover:text-unnes-gold"
                      >
                        <span>Ruang {b.room_code}</span>
                        <ArrowUpRight className="h-4 w-4 opacity-60" />
                      </button>

                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            isCancelled
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-[#2E1C22] dark:text-rose-300'
                              : active
                                ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5]'
                                : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#667085] dark:border-ink-line dark:bg-ink-canvas dark:text-[#98A2B3]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCancelled ? 'bg-rose-500' : active ? 'bg-[#16A34A] dark:bg-[#4ADE80]' : 'bg-[#98A2B3]'
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
                      className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[#DCE2EC] bg-[#F6F8FB] px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-[#101828] transition hover:border-unnes-navy active:scale-95 dark:border-ink-line-strong dark:bg-ink-subtle dark:text-unnes-gold"
                    >
                      <span>{b.id}</span>
                      {copiedId === b.id ? (
                        <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-65" />
                      )}
                    </button>
                  </div>

                  {/* Schedule & Participants */}
                  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 rounded-xl bg-[#F6F8FB] px-3 py-2 text-xs font-medium text-[#344054] sm:text-[13px] dark:bg-ink-subtle/70 dark:text-[#D0D7E6]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 flex-none text-[#667085] dark:text-[#8A93A6]" />
                      {formatDateKeyLabel(b.booking_date, days)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Clock className="h-3.5 w-3.5 flex-none text-[#667085] dark:text-[#8A93A6]" />
                      {formatHourRange(b.start_hour, b.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Users className="h-3.5 w-3.5 flex-none text-[#667085] dark:text-[#8A93A6]" />
                      {b.participants} orang
                    </span>
                  </div>

                  {/* Purpose & NIM — wrap rapi tanpa mendorong lebar layar */}
                  <p className="break-words text-xs leading-relaxed text-[#475467] dark:text-[#B0B8C9]">
                    {b.purpose} <span className="text-[#98A2B3]">·</span> NIM{' '}
                    <span className="font-mono tabular-nums">{b.nim}</span>
                  </p>
                </div>

                {cancellable && (
                  <div className="border-t border-[#ECEFF4] pt-3 dark:border-ink-line">
                    {confirmId === b.id ? (
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="sh-btn-secondary h-9 px-3 text-xs"
                        >
                          Tidak
                        </button>
                        <button
                          type="button"
                          disabled={cancellingId === b.id}
                          onClick={() => handleConfirmCancel(b)}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#DC2626] px-3.5 text-xs font-semibold text-white transition hover:bg-[#B91C1C] active:scale-95 disabled:opacity-50"
                        >
                          {cancellingId === b.id ? 'Membatalkan...' : 'Ya, batalkan'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(b.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-[#DC2626] hover:underline active:opacity-80 dark:text-[#F87171]"
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
