import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, MousePointerClick, Star } from 'lucide-react';
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
    navigate,
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

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportRoomUsed(room.code);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate('find')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar ruang
      </button>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Clean Photo + Architectural Dividers (No box-in-box) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#EEF0F4] dark:bg-ink-card">
            <img src={room.image_url} alt={`Ruang ${room.code}`} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#EAECEF] pb-5 dark:border-white/[0.08]">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
                  Ruang {room.code}
                </h1>
                <p className="mt-1 text-sm text-[#5B667B] dark:text-[#9AA7BE]">
                  {room.location_label} · {room.capacity} kursi · {freeHoursOnDetailDay.length}/10 jam kosong
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#141923] dark:text-[#EEF2F7]">
                <span className={`h-2 w-2 rounded-full ${isFreeAtFilter ? 'bg-[#22A06B]' : 'bg-[#9CA6BA]'}`} />
                {isFreeAtFilter ? `Kosong s.d. ${formatHour(freeUntilAtFilter)}` : `Terisi ${formatHour(filters.start)}`}
              </span>
            </div>

            {/* Tarif Ruangan */}
            <div className="border-b border-[#EAECEF] pb-5 dark:border-white/[0.08]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-bold text-[#141923] dark:text-[#EEF2F7]">Tarif ruangan</h2>
                <span className="text-sm font-bold text-[#141923] dark:text-unnes-gold">
                  {formatPriceBadge(pricePerHour)}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
                {room.price_note || 'Mahasiswa FEB gratis'}
              </p>
              {pricePerHour > 0 && (
                <p className="mt-2 text-xs font-medium text-[#6B768C] dark:text-[#8E9BB3]">
                  Estimasi: 1 jam {formatRupiah(pricePerHour)} · 2 jam {formatRupiah(pricePerHour * 2)} · 3 jam{' '}
                  {formatRupiah(pricePerHour * 3)}
                </p>
              )}
            </div>

            {/* Deskripsi & Fasilitas */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[#141923] dark:text-[#EEF2F7]">Fasilitas & informasi</h2>
              <p className="text-sm leading-relaxed text-[#434E63] dark:text-[#B8C3D9]">{room.description}</p>
              <p className="text-[13px] font-medium text-[#141923] dark:text-[#EEF2F7]">
                {(room.facilities || []).join(' · ')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Sticky Schedule & Booking Panel */}
        <div className="lg:col-span-5">
          <div className="sh-panel sticky top-6 space-y-5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#141923] dark:text-[#EEF2F7]">Jadwal ketersediaan</h2>
              <span className="text-xs text-[#7B869B] dark:text-[#8693AA]">07.00–17.00 WIB</span>
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
                <p className="flex items-center gap-1.5 text-xs text-[#6B768C] dark:text-[#8E9BB3]">
                  <MousePointerClick className="h-3.5 w-3.5 flex-none text-[#22A06B]" />
                  Klik kotak hijau untuk langsung booking di jam tersebut.
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
                    <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                    {reporting ? 'Melapor...' : 'Lapor terpakai'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alternatif Kosong */}
      <section className="space-y-4 border-t border-[#EAECEF] pt-7 dark:border-white/[0.08]">
        <h2 className="text-base font-bold text-[#141923] dark:text-[#EEF2F7]">
          Alternatif kosong · {filterDay.label}, {formatHour(filters.start)}
        </h2>

        {alternatives.length > 0 ? (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {alternatives.map((alt) => (
              <RoomCard key={alt.code} room={alt} dayIndex={filters.day} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Belum ada alternatif kosong di jam ini.
          </p>
        )}
      </section>
    </div>
  );
}
