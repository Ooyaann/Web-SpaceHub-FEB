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
        Kembali
      </button>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Info Ruang + Tarif */}
        <div className="lg:col-span-7">
          <div className="sh-card overflow-hidden">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img src={room.image_url} alt={`Ruang ${room.code}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-unnes-navy/90 via-unnes-navy/35 to-transparent p-5 text-white">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{room.code}</h2>
                    <p className="text-xs text-blue-100">{room.location_label}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      isFreeAtFilter ? 'bg-unnes-gold text-unnes-gold-ink' : 'bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  >
                    {isFreeAtFilter ? `Kosong s.d. ${formatHour(freeUntilAtFilter)}` : `Terisi ${formatHour(filters.start)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {/* Kartu Tarif Ringkas */}
              <div className="rounded-xl border border-unnes-gold/60 bg-amber-50/70 p-3.5 dark:border-unnes-gold/30 dark:bg-amber-500/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-unnes-gold">
                    <Tag className="h-3.5 w-3.5" />
                    Tarif Ruangan
                  </span>
                  <span className="rounded-full bg-unnes-navy px-3 py-0.5 text-xs font-extrabold text-unnes-gold">
                    {formatPriceBadge(pricePerHour)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-amber-950/90 dark:text-amber-100/90">
                  {room.price_note || 'Mahasiswa FEB gratis'}
                </p>
                {pricePerHour > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    {[1, 2, 3].map((h) => (
                      <span key={h} className="rounded-md bg-white/75 px-2 py-0.5 dark:bg-black/25">
                        {h}j: {formatRupiah(pricePerHour * h)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Spec Ringkas */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Kapasitas
                  </div>
                  <div className="mt-1 text-base font-extrabold">{room.capacity} kursi</div>
                </div>
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Lokasi
                  </div>
                  <div className="mt-1 text-sm font-extrabold">
                    {room.building} · Lt. {room.floor}
                  </div>
                </div>
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Kosong
                  </div>
                  <div className="mt-1 text-base font-extrabold">
                    {freeHoursOnDetailDay.length}/{OPERATIONAL_HOURS.length} jam
                  </div>
                </div>
              </div>

              {/* Deskripsi 1 baris & Fasilitas */}
              <p className="text-xs text-slate-600 dark:text-slate-300">{room.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {(room.facilities || []).map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#e6eeff] px-2.5 py-1 text-xs font-bold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Jadwal Interaktif & Aksi */}
        <div className="lg:col-span-5">
          <div className="sh-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0f1d3d] dark:text-white">Ketersediaan Per Jam</h3>
              <span className="text-[11px] font-semibold text-slate-400">07.00–17.00 WIB</span>
            </div>

            <DatePickerPopover
              label="Tanggal"
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
              onSelectHour={(hour) => openBookingForm(room.code, detailDayIndex, hour)}
            />

            <Legend compact />

            <div className="flex items-center gap-1.5 rounded-lg bg-unnes-surface px-3 py-2 text-[11px] font-medium text-slate-600 dark:bg-[#0d1730] dark:text-slate-300">
              <MousePointerClick className="h-3.5 w-3.5 flex-none text-unnes-blue dark:text-unnes-gold" />
              <span>Klik kotak hijau untuk langsung booking di jam tersebut.</span>
            </div>

            <button
              type="button"
              disabled={!hasBookableSlot}
              onClick={() => openBookingForm(room.code, detailDayIndex)}
              className="sh-btn-primary w-full py-3"
            >
              {hasBookableSlot ? `Booking ${room.code}` : 'Slot Penuh / Lewat'}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => toggleFavorite(room.code)} className="sh-btn-secondary text-xs">
                <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : ''}`} />
                {isFav ? 'Favorit' : 'Simpan'}
              </button>

              <button
                type="button"
                disabled={reporting}
                onClick={handleReport}
                className="sh-btn-secondary border-amber-300/80 text-xs text-amber-800 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
              >
                <AlertTriangle className="h-4 w-4" />
                {reporting ? 'Melapor...' : 'Lapor Terpakai'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alternatif Kosong */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#0f1d3d] dark:text-white">
            Alternatif Kosong ({filterDay.label} · {formatHour(filters.start)})
          </h3>
        </div>

        {alternatives.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
