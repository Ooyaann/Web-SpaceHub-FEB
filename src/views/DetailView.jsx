import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { OPERATIONAL_HOURS } from '../lib/constants';
import { formatHour, formatPriceBadge, formatRupiah } from '../lib/dateWib';
import {
  getFreeUntilHour,
  getSlotStatus,
  isRoomIdleAllDay,
  isWindowFree,
} from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
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
  const idleAllDay = room
    ? isRoomIdleAllDay({
        roomCode: room.code,
        dateKey: detailDay.key,
        weekday: detailDay.weekday,
        bookings,
        reports,
        userEmail: user?.email,
      })
    : false;

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
        // Prioritaskan gedung yang sama lalu kapasitas mirip
        const sameBuildingDiff = (b.building === room.building ? 1 : 0) - (a.building === room.building ? 1 : 0);
        if (sameBuildingDiff !== 0) return sameBuildingDiff;
        return Math.abs(a.capacity - room.capacity) - Math.abs(b.capacity - room.capacity);
      })
      .slice(0, 4);
  }, [rooms, room, filterDay, filters, bookings, reports, user, nowWib]);

  if (!room) {
    return (
      <div className="sh-card p-8 text-center">
        <p className="text-sm font-semibold">Ruangan tidak ditemukan.</p>
        <button type="button" onClick={() => navigate('find')} className="sh-btn-secondary mt-3">
          Kembali ke Cari Ruang
        </button>
      </div>
    );
  }

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

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Kolom Kiri: Info Lengkap Ruang + Tarif (Fokus Utama Klien) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="sh-card overflow-hidden">
            <div className="relative">
              <img
                src={room.image_url}
                alt={`Foto Ruang ${room.code}`}
                className="h-56 w-full object-cover sm:h-64"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-unnes-navy/90 via-unnes-navy/40 to-transparent p-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{room.code}</h2>
                    <p className="text-xs text-blue-100">{room.location_label}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      isFreeAtFilter
                        ? 'bg-unnes-gold text-unnes-gold-ink'
                        : 'bg-white/20 text-white backdrop-blur-sm'
                    }`}
                  >
                    {isFreeAtFilter
                      ? `Kosong sampai ${formatHour(freeUntilAtFilter)}`
                      : `Terisi pada ${formatHour(filters.start)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Highlight Kartu Tarif Ruangan */}
              <div className="rounded-xl border border-unnes-gold/60 bg-amber-50/70 p-4 dark:border-unnes-gold/30 dark:bg-amber-500/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-unnes-gold">
                    <Tag className="h-4 w-4" />
                    Informasi Tarif Ruangan
                  </div>
                  <span className="rounded-full bg-unnes-navy px-3 py-1 text-xs font-extrabold text-unnes-gold">
                    {formatPriceBadge(pricePerHour)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
                  {room.price_note || 'Gratis untuk kegiatan akademik mahasiswa FEB UNNES.'}
                </p>
                {pricePerHour > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    <span className="rounded-md bg-white/70 px-2 py-0.5 dark:bg-black/25">
                      1 jam: {formatRupiah(pricePerHour)}
                    </span>
                    <span className="rounded-md bg-white/70 px-2 py-0.5 dark:bg-black/25">
                      2 jam: {formatRupiah(pricePerHour * 2)}
                    </span>
                    <span className="rounded-md bg-white/70 px-2 py-0.5 dark:bg-black/25">
                      3 jam: {formatRupiah(pricePerHour * 3)}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 Ringkasan Utama */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Kapasitas
                  </div>
                  <div className="mt-1 text-base font-extrabold text-[#0f1d3d] dark:text-white">
                    {room.capacity} orang
                  </div>
                </div>
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Lokasi
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-[#0f1d3d] dark:text-white">
                    {room.building} · Lt. {room.floor}
                  </div>
                </div>
                <div className="rounded-xl bg-unnes-surface p-3 dark:bg-[#0d1730]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-unnes-blue dark:text-unnes-blue-light" />
                    Jam Kosong
                  </div>
                  <div className="mt-1 text-base font-extrabold text-[#0f1d3d] dark:text-white">
                    {freeHoursOnDetailDay.length}/{OPERATIONAL_HOURS.length} jam
                  </div>
                </div>
              </div>

              {/* Deskripsi Ruangan */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Deskripsi Ruangan
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {room.description ||
                    `Ruang kuliah ${room.code} di ${room.location_label} dengan kapasitas ${room.capacity} peserta.`}
                </p>
              </div>

              {/* Daftar Fasilitas Lengkap */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fasilitas Tersedia ({(room.facilities || []).length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(room.facilities || []).map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#e6eeff] px-3 py-1.5 text-xs font-bold text-unnes-blue dark:bg-[#1c2a52] dark:text-unnes-blue-light"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Jadwal Per Jam & Aksi Booking / Lapor */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sh-card space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0f1d3d] dark:text-white">
                <Calendar className="h-4 w-4 text-unnes-blue dark:text-unnes-blue-light" />
                Jadwal Ketersediaan
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">07.00 – 17.00 WIB</span>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pilih Tanggal Cek Jadwal
              </span>
              <select
                value={detailDayIndex}
                onChange={(e) => setDetailDayIndex(Number(e.target.value))}
                className="sh-input"
              >
                {days.map((d) => (
                  <option key={d.key} value={d.index}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

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
            />

            <Legend compact />

            <div className="flex items-start gap-2 rounded-xl bg-unnes-surface p-3 text-[11px] text-slate-600 dark:bg-[#0d1730] dark:text-slate-300">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-unnes-blue dark:text-unnes-blue-light" />
              <div>
                Bingkai kuning menandakan jam pilihan filter. Status <strong>Ada kelas</strong> adalah jadwal kuliah
                contoh, sedangkan booking & laporan terpakai tersimpan langsung di server.{' '}
                {idleAllDay && <strong className="text-emerald-700 dark:text-emerald-400">Ruang ini kosong seharian pada tanggal ini.</strong>}
              </div>
            </div>

            <button
              type="button"
              disabled={!hasBookableSlot}
              onClick={() => openBookingForm(room.code, detailDayIndex)}
              className="sh-btn-primary w-full py-3"
            >
              {hasBookableSlot ? `Booking Ruang ${room.code}` : 'Tidak Ada Jam Kosong di Tanggal Ini'}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => toggleFavorite(room.code)}
                className="sh-btn-secondary text-xs"
              >
                <Star className={`h-4 w-4 ${isFav ? 'fill-unnes-gold text-unnes-gold' : ''}`} />
                {isFav ? 'Hapus Favorit' : 'Simpan Favorit'}
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

      {/* Rekomendasi Ruang Alternatif */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-extrabold text-[#0f1d3d] dark:text-white">
            Rekomendasi Ruang Alternatif Kosong di Jam yang Sama
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kosong pada {filterDay.label}, mulai {formatHour(filters.start)} ({filters.dur} jam).
          </p>
        </div>

        {alternatives.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {alternatives.map((alt) => (
              <RoomCard key={alt.code} room={alt} dayIndex={filters.day} />
            ))}
          </div>
        ) : (
          <div className="sh-card border-dashed p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Belum ada ruangan alternatif lain yang kosong pada jam filter yang dipilih.
          </div>
        )}
      </section>
    </div>
  );
}
