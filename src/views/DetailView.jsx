import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MousePointerClick,
  Star,
  Tag,
  Users,
} from 'lucide-react';
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
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('find')} className="sh-chip">
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke daftar ruang
      </button>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="sh-card overflow-hidden">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img src={room.image_url} alt={`Ruang ${room.code}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070D1A]/85 via-[#070D1A]/30 to-transparent p-5 text-white">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h1 className="font-mono text-2xl font-extrabold tracking-tight">{room.code}</h1>
                    <p className="text-xs text-[#D5E0F5]">{room.location_label}</p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      isFreeAtFilter ? 'bg-emerald-700 text-white' : 'bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  >
                    {isFreeAtFilter
                      ? `Kosong s.d. ${formatHour(freeUntilAtFilter)}`
                      : `Terisi ${formatHour(filters.start)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Tarif Ruangan */}
              <div className="rounded-lg border border-line-light bg-surface-subtle/70 p-4 dark:border-unnes-night-line dark:bg-unnes-night-input">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#526382] dark:text-unnes-night-muted">
                    <Tag className="h-3.5 w-3.5" />
                    Tarif Ruangan
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                      pricePerHour > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-unnes-gold/20 dark:text-unnes-gold'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    }`}
                  >
                    {formatPriceBadge(pricePerHour)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#3C4E70] dark:text-[#C5D2EA]">
                  {room.price_note || 'Mahasiswa FEB gratis'}
                </p>
                {pricePerHour > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold text-[#3C4E70] dark:text-[#C5D2EA]">
                    {[1, 2, 3].map((h) => (
                      <span
                        key={h}
                        className="rounded border border-line-light bg-white px-2.5 py-0.5 dark:border-unnes-night-line dark:bg-unnes-night-card"
                      >
                        {h}j: {formatRupiah(pricePerHour * h)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-surface-subtle/70 p-3 dark:bg-unnes-night-input">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#526382] dark:text-unnes-night-muted">
                    <Users className="h-3.5 w-3.5" />
                    Kapasitas
                  </div>
                  <div className="mt-1 font-mono text-base font-bold">{room.capacity} kursi</div>
                </div>
                <div className="rounded-lg bg-surface-subtle/70 p-3 dark:bg-unnes-night-input">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#526382] dark:text-unnes-night-muted">
                    <Building2 className="h-3.5 w-3.5" />
                    Lokasi
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold">
                    {room.building} · Lt. {room.floor}
                  </div>
                </div>
                <div className="rounded-lg bg-surface-subtle/70 p-3 dark:bg-unnes-night-input">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#526382] dark:text-unnes-night-muted">
                    <Clock className="h-3.5 w-3.5" />
                    Jam Kosong
                  </div>
                  <div className="mt-1 font-mono text-base font-bold">
                    {freeHoursOnDetailDay.length}/{OPERATIONAL_HOURS.length}j
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#3C4E70] dark:text-[#C5D2EA]">{room.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {(room.facilities || []).map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line-light bg-surface-subtle/70 px-2.5 py-1 text-xs font-semibold text-[#1B2B4B] dark:border-unnes-night-line dark:bg-unnes-night-input dark:text-[#D9E3F5]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sh-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">Jadwal Ketersediaan</h2>
              <span className="font-mono text-[11px] font-medium text-[#6A7B9C]">07.00–17.00 WIB</span>
            </div>

            <DatePickerPopover
              label="Pilih Tanggal"
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
                <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-[11px] font-medium text-[#526382] dark:bg-unnes-night-input dark:text-unnes-night-muted">
                  <MousePointerClick className="h-3.5 w-3.5 flex-none text-emerald-600 dark:text-emerald-400" />
                  <span>Klik kotak hijau untuk langsung booking di jam tersebut.</span>
                </div>

                <button
                  type="button"
                  disabled={!hasBookableSlot}
                  onClick={() => openBookingForm(room.code, detailDayIndex)}
                  className="sh-btn-primary w-full"
                >
                  {hasBookableSlot ? `Booking ${room.code}` : 'Slot Penuh / Lewat'}
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
                    className="sh-btn-secondary text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {reporting ? 'Melapor...' : 'Lapor Terpakai'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-[#0F1B33] dark:text-[#F1F5FB]">
          Alternatif Kosong ({filterDay.label} · {formatHour(filters.start)})
        </h2>

        {alternatives.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {alternatives.map((alt) => (
              <RoomCard key={alt.code} room={alt} dayIndex={filters.day} />
            ))}
          </div>
        ) : (
          <div className="sh-card border-dashed p-6 text-center text-xs text-[#526382] dark:text-unnes-night-muted">
            Belum ada alternatif kosong di jam ini.
          </div>
        )}
      </section>
    </div>
  );
}
