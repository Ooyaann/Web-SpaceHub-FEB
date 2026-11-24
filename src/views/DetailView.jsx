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
        {/* Left: Room Overview + Pricing */}
        <div className="lg:col-span-7">
          <div className="sh-card overflow-hidden">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img src={room.image_url} alt={`Ruang ${room.code}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent p-5 text-white">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">{room.code}</h1>
                    <p className="text-xs text-slate-200">{room.location_label}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      isFreeAtFilter ? 'bg-emerald-600 text-white' : 'bg-white/20 text-white backdrop-blur-md'
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
              <div className="rounded-xl border border-line-light bg-slate-50 p-4 dark:border-line-dark dark:bg-surface-subtle-dark">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Tag className="h-3.5 w-3.5" />
                    Tarif Ruangan
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                      pricePerHour > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    }`}
                  >
                    {formatPriceBadge(pricePerHour)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {room.price_note || 'Mahasiswa FEB gratis'}
                </p>
                {pricePerHour > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {[1, 2, 3].map((h) => (
                      <span key={h} className="rounded-md bg-white px-2.5 py-0.5 dark:bg-slate-800">
                        {h} jam: {formatRupiah(pricePerHour * h)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-surface-subtle-dark">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    Kapasitas
                  </div>
                  <div className="mt-1 text-base font-extrabold">{room.capacity} kursi</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-surface-subtle-dark">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Lokasi
                  </div>
                  <div className="mt-1 text-sm font-extrabold">
                    {room.building} · Lt. {room.floor}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-surface-subtle-dark">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Jam Kosong
                  </div>
                  <div className="mt-1 text-base font-extrabold">
                    {freeHoursOnDetailDay.length}/{OPERATIONAL_HOURS.length}j
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{room.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {(room.facilities || []).map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Schedule & Actions */}
        <div className="lg:col-span-5">
          <div className="sh-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Jadwal Ketersediaan</h2>
              <span className="text-[11px] font-medium text-slate-400">07.00–17.00 WIB</span>
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
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 dark:bg-surface-subtle-dark dark:text-slate-400">
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
                    <Star className={`h-4 w-4 ${isFav ? 'fill-brand-gold text-brand-gold' : ''}`} />
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

      {/* Alternatif Kosong */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
          Alternatif Kosong ({filterDay.label} · {formatHour(filters.start)})
        </h2>

        {alternatives.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {alternatives.map((alt) => (
              <RoomCard key={alt.code} room={alt} dayIndex={filters.day} />
            ))}
          </div>
        ) : (
          <div className="sh-card border-dashed p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Belum ada alternatif kosong di jam ini.
          </div>
        )}
      </section>
    </div>
  );
}
