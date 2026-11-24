import { useMemo } from 'react';
import { RotateCcw, Search, SlidersHorizontal, Star } from 'lucide-react';
import { FACILITY_OPTIONS, START_HOURS, getFloorOptions } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import RoomCard from '../components/RoomCard';
import SkeletonCard from '../components/SkeletonCard';

export default function FindView() {
  const {
    user,
    rooms,
    bookings,
    reports,
    favorites,
    loading,
    days,
    nowWib,
    filters,
    updateFilter,
    toggleFacilityFilter,
    resetFilters,
  } = useSpaceHub();

  const floorOptions = useMemo(() => getFloorOptions(rooms), [rooms]);
  const selectedDay = days[filters.day] || days[0];

  const freeNowCount = useMemo(() => {
    if (nowWib.hour < 7 || nowWib.hour > 16) return 0;
    const today = days[0];
    return rooms.filter(
      (r) =>
        getSlotStatus({
          roomCode: r.code,
          dateKey: today.key,
          weekday: today.weekday,
          hour: nowWib.hour,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        }) === 'f'
    ).length;
  }, [rooms, bookings, reports, user, days, nowWib]);

  const filteredRooms = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rooms
      .filter((r) => {
        if (q && !r.code.toLowerCase().includes(q) && !r.location_label.toLowerCase().includes(q)) {
          return false;
        }
        if (filters.floorKey && `${r.building}-${r.floor}` !== filters.floorKey) return false;
        if (r.capacity < filters.cap) return false;
        if (filters.facilities.length > 0 && !filters.facilities.every((f) => (r.facilities || []).includes(f))) {
          return false;
        }
        if (filters.favOnly && !favorites.has(r.code)) return false;
        return isWindowFree({
          roomCode: r.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          duration: filters.dur,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        });
      })
      .sort((a, b) => {
        if (filters.sort === 'cap') return b.capacity - a.capacity;
        const endA = getFreeUntilHour({
          roomCode: a.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        });
        const endB = getFreeUntilHour({
          roomCode: b.code,
          dateKey: selectedDay.key,
          weekday: selectedDay.weekday,
          startHour: filters.start,
          bookings,
          reports,
          userEmail: user?.email,
          todayWib: nowWib.dateKey,
          nowHourWib: nowWib.hour,
        });
        return endB - endA || b.capacity - a.capacity;
      });
  }, [rooms, filters, favorites, selectedDay, bookings, reports, user, nowWib]);

  const hasExtraFilter =
    Boolean(filters.floorKey) ||
    filters.cap > 0 ||
    filters.facilities.length > 0 ||
    filters.favOnly ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <section
        className="overflow-hidden rounded-2xl p-6 text-white shadow-soft"
        style={{
          backgroundImage: `linear-gradient(95deg, rgba(11, 42, 111, 0.96) 45%, rgba(11, 42, 111, 0.6) 100%), url(/images/feb-hero.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-md">
            <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-unnes-gold">
              {nowWib.timeLabel} · {days[0].label}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Halo, {user?.name}!
            </h2>
            <p className="mt-1 text-sm text-blue-100/90">
              Temukan ruang kelas kosong FEB UNNES lengkap dengan fasilitas & tarif, lalu booking langsung tanpa bentrok.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center backdrop-blur-sm">
              <div className="text-2xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {freeNowCount}
              </div>
              <div className="mt-1 text-[11px] text-blue-100">Kosong kini</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center backdrop-blur-sm">
              <div className="text-2xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {filteredRooms.length}
              </div>
              <div className="mt-1 text-[11px] text-blue-100">Cocok filter</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center backdrop-blur-sm">
              <div className="text-2xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {favorites.size}
              </div>
              <div className="mt-1 text-[11px] text-blue-100">Favorit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Card */}
      <section className="sh-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter Ketersediaan Ruang
          </div>
          {hasExtraFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-unnes-blue hover:underline dark:text-unnes-blue-light"
            >
              <RotateCcw className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tanggal</span>
            <select
              value={filters.day}
              onChange={(e) => updateFilter('day', Number(e.target.value))}
              className="sh-input"
            >
              {days.map((d) => (
                <option key={d.key} value={d.index}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam Mulai</span>
            <select
              value={filters.start}
              onChange={(e) => updateFilter('start', Number(e.target.value))}
              className="sh-input"
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Durasi</span>
            <select
              value={filters.dur}
              onChange={(e) => updateFilter('dur', Number(e.target.value))}
              className="sh-input"
            >
              <option value={1}>1 jam</option>
              <option value={2}>2 jam</option>
              <option value={3}>3 jam</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Gedung / Lantai
            </span>
            <select
              value={filters.floorKey}
              onChange={(e) => updateFilter('floorKey', e.target.value)}
              className="sh-input"
            >
              <option value="">Semua ({rooms.length})</option>
              {floorOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kapasitas</span>
            <select
              value={filters.cap}
              onChange={(e) => updateFilter('cap', Number(e.target.value))}
              className="sh-input"
            >
              <option value={0}>Bebas</option>
              <option value={30}>30+ orang</option>
              <option value={45}>45+ orang</option>
              <option value={60}>60+ orang</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Urutkan</span>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="sh-input"
            >
              <option value="cap">Kapasitas terbesar</option>
              <option value="long">Kosong paling lama</option>
            </select>
          </label>
        </div>

        {/* Search & Facility Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-unnes-border/70 pt-3.5 dark:border-unnes-border-dark">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Cari kode ruang (mis. L4 512, Lab)..."
              className="sh-input py-1.5 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FACILITY_OPTIONS.map((fac) => {
              const active = filters.facilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => toggleFacilityFilter(fac)}
                  className={`sh-chip ${active ? 'sh-chip-active' : ''}`}
                >
                  {fac}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => updateFilter('favOnly', !filters.favOnly)}
              className={`sh-chip ${filters.favOnly ? 'sh-chip-active' : ''}`}
            >
              <Star className={`h-3 w-3 ${filters.favOnly ? 'fill-unnes-gold-ink' : ''}`} />
              Favorit saja
            </button>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      {loading ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {filteredRooms.map((room) => (
            <RoomCard key={room.code} room={room} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <p className="text-sm font-bold text-[#0f1d3d] dark:text-white">
            Tidak ada ruang kosong pada waktu & filter ini.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Coba pilih tanggal besok, ganti jam mulai, kurangi durasi, atau lepas beberapa filter fasilitas.
          </p>
          <button type="button" onClick={resetFilters} className="sh-btn-secondary mt-4">
            Reset ke Filter Awal
          </button>
        </div>
      )}
    </div>
  );
}
