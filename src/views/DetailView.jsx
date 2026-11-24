import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ChevronRight, MousePointerClick, Star, Tag } from 'lucide-react';
import { OPERATIONAL_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge, formatRupiah } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import HourBar from '../components/HourBar';
import Legend from '../components/Legend';
import RoomCard from '../components/RoomCard';

export default function DetailView() {
  const {
    rooms,
    bookings,
    reports,
    favorites,
    user,
    isAdmin,
    days,
    nowWib,
    filters,
    selectedRoomCode,
    detailDayIndex,
    setDetailDayIndex,
    backLabel,
    rootNavLabel,
    goBack,
    openBookingForm,
    toggleFavorite,
    reportRoomUsed,
  } = useSpaceHub();

  const [reporting, setReporting] = useState(false);

  const room = rooms.find((r) => r.code === selectedRoomCode) || rooms[0];
  const detailDay = days[detailDayIndex] || days[0];
  const filterDay = days[filters.day] || days[0];

  const isFreeAtFilter = useMemo(
    () =>
      room
        ? isWindowFree({
            roomCode: room.code,
            dateKey: filterDay.key,
            weekday: filterDay.weekday,
            startHour: filters.start,
            duration: filters.dur,
            bookings,
            reports,
            userEmail: user?.email,
            todayWib: nowWib.dateKey,
            nowHourWib: nowWib.hour,
          })
        : false,
    [room, filterDay, filters, bookings, reports, user, nowWib]
  );

  const freeUntilAtFilter = useMemo(
    () =>
      room
        ? getFreeUntilHour({
            roomCode: room.code,
            dateKey: filterDay.key,
            weekday: filterDay.weekday,
            startHour: filters.start,
            bookings,
            reports,
            userEmail: user?.email,
            todayWib: nowWib.dateKey,
            nowHourWib: nowWib.hour,
          })
        : filters.start,
    [room, filterDay, filters, bookings, reports, user, nowWib]
  );

  const freeHoursOnDetailDay = useMemo(() => {
    if (!room) return [];
    return OPERATIONAL_HOURS.filter(
      (h) =>
        getSlotStatus({
          roomCode: room.code,
          dateKey: detailDay.key,
          weekday: detailDay.weekday,
          hour: h,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        }) === 'f'
    );
  }, [room, detailDay, bookings, reports, user, nowWib]);

  const hasBookableSlot = freeHoursOnDetailDay.some((h) => h <= 15);

  const alternatives = useMemo(() => {
    if (!room) return [];
    return rooms
      .filter(
        (other) =>
          other.code !== room.code &&
          isWindowFree({
            roomCode: other.code,
            dateKey: filterDay.key,
            weekday: filterDay.weekday,
            startHour: filters.start,
            duration: filters.dur,
            bookings,
            reports,
            userEmail: user?.email,
            todayWib: nowWib.dateKey,
            nowHourWib: nowWib.hour,
          })
      )
      .sort((a, b) => {
        const sameBuilding = (b.building === room.building ? 1 : 0) - (a.building === room.building ? 1 : 0);
        if (sameBuilding !== 0) return sameBuilding;
        return Math.abs(a.capacity - room.capacity) - Math.abs(b.capacity - room.capacity);
      })
      .slice(0, 3);
  }, [rooms, room, filterDay, filters, bookings, reports, user, nowWib]);

  if (!room) return null;

  const isFav = favorites.has(room.code);
  const pricePerHour = Number(room.price_per_hour) || 0;
  const isPaid = pricePerHour > 0;

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportRoomUsed(room.code);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Contextual Back Button & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={goBack} className="sh-btn-secondary h-9 px-3.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke {backLabel}
        </button>

        <div className="flex items-center gap-1.5 text-xs font-medium text-[#667085] dark:text-[#8A93A6]">
          <span>{rootNavLabel}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-[#101828] dark:text-[#F5F7FA]">Ruang {room.code}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Photo & Room Details Card */}
        <div className="sh-panel overflow-hidden lg:col-span-7">
          <div className="aspect-[16/9] w-full overflow-hidden bg-[#EBEEF4] dark:bg-ink-subtle">
            <img src={room.image_url} alt={`Ruang ${room.code}`} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ECEFF4] pb-5 dark:border-ink-line">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">
                  Ruang {room.code}
                </h1>
                <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
                  {room.location_label} · Kapasitas {room.capacity} kursi · {freeHoursOnDetailDay.length}/10 jam kosong
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isFreeAtFilter
                    ? 'border-[#CBEFD9] bg-[#F2FBF6] text-[#067647] dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA]'
                    : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#667085] dark:border-ink-line dark:bg-ink-canvas dark:text-[#98A2B3]'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isFreeAtFilter ? 'bg-[#10B981]' : 'bg-[#98A2B3]'}`} />
                {isFreeAtFilter ? `Kosong s.d. ${formatHour(freeUntilAtFilter)}` : `Terisi ${formatHour(filters.start)}`}
              </span>
            </div>

            {/* Tarif Ruangan */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECEFF4] pb-5 dark:border-ink-line">
              <div>
                <h2 className="text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">Informasi tarif ruangan</h2>
                <p className="mt-0.5 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
                  {room.price_note || 'Mahasiswa FEB gratis'}
                </p>
                {isPaid && (
                  <p className="mt-1.5 text-xs font-medium text-[#667085] dark:text-[#8A93A6]">
                    Estimasi: 1 jam {formatRupiah(pricePerHour)} · 2 jam {formatRupiah(pricePerHour * 2)} · 3 jam{' '}
                    {formatRupiah(pricePerHour * 3)}
                  </p>
                )}
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                  isPaid
                    ? 'border-[#FDE68A] bg-[#FEF8E6] text-[#92400E] dark:border-unnes-gold/35 dark:bg-[#2F2817] dark:text-unnes-gold'
                    : 'border-[#D5E0F6] bg-[#EEF3FC] text-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#F5F7FA]'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                {formatPriceBadge(pricePerHour)}
              </span>
            </div>

            {/* Deskripsi & Fasilitas */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">Fasilitas & deskripsi</h2>
              <p className="text-[13px] leading-relaxed text-[#475467] dark:text-[#B0B8C9]">{room.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(room.facilities || []).map((fac) => (
                  <span
                    key={fac}
                    className="rounded-lg border border-[#E4E7EC] bg-[#F4F6FA] px-2.5 py-1 text-xs font-medium text-[#344054] dark:border-ink-line dark:bg-ink-subtle dark:text-[#D0D7E6]"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sticky Schedule & Booking Panel */}
        <div className="lg:col-span-5">
          <div className="sh-panel sticky top-6 space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#101828] dark:text-[#F5F7FA]">Jadwal ketersediaan</h2>
              <span className="text-xs font-medium text-[#667085] dark:text-[#8A93A6]">07.00–17.00 WIB</span>
            </div>

            <DatePickerPopover
              label="Pilih tanggal"
              days={days}
              value={detailDayIndex}
              onChange={(idx) => setDetailDayIndex(idx)}
            />

            <HourBar
              roomCode={room.code}
              dateKey={detailDay.key}
              weekday={detailDay.weekday}
              bookings={bookings}
              reports={reports}
              userEmail={user?.email}
              todayWib={nowWib.dateKey}
              nowHourWib={nowWib.hour}
              highlightStart={detailDayIndex === filters.day ? filters.start : -1}
              highlightDur={detailDayIndex === filters.day ? filters.dur : 0}
              onSelectHour={isAdmin ? null : (hour) => openBookingForm(room.code, detailDayIndex, hour)}
            />

            <Legend compact />

            {!isAdmin && (
              <>
                <p className="flex items-center gap-1.5 text-xs text-[#667085] dark:text-[#8A93A6]">
                  <MousePointerClick className="h-3.5 w-3.5 flex-none text-[#10B981]" />
                  Klik angka jam bertitik hijau untuk langsung booking mulai jam tersebut.
                </p>

                <button
                  type="button"
                  disabled={!hasBookableSlot}
                  onClick={() => openBookingForm(room.code, detailDayIndex)}
                  className="sh-btn-primary w-full"
                >
                  {hasBookableSlot ? `Booking ruang ${room.code}` : 'Slot penuh / lewat'}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => toggleFavorite(room.code)} className="sh-btn-secondary text-xs">
                    <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : ''}`} />
                    {isFav ? 'Tersimpan' : 'Simpan'}
                  </button>

                  <button
                    type="button"
                    disabled={reporting}
                    onClick={handleReport}
                    className="sh-btn-secondary text-xs"
                  >
                    <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                    {reporting ? 'Melapor...' : 'Lapor terpakai'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alternatif Kosong */}
      <section className="space-y-4 border-t border-[#E4E7EE] pt-6 dark:border-ink-line">
        <h2 className="text-base font-bold text-[#101828] dark:text-[#F5F7FA]">
          Rekomendasi ruang alternatif kosong · {filterDay.label}, {formatHour(filters.start)}
        </h2>

        {alternatives.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {alternatives.map((alt) => (
              <RoomCard key={alt.code} room={alt} dayIndex={filters.day} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Belum ada alternatif kosong di jam ini.
          </p>
        )}
      </section>
    </div>
  );
}
