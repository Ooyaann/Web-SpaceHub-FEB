import { useMemo } from 'react';
import { RotateCcw, Search, Star } from 'lucide-react';
import { FACILITY_OPTIONS, START_HOURS, getFloorOptions } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
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
        if (filters.priceType === 'free' && Number(r.price_per_hour) > 0) return false;
        if (filters.priceType === 'paid' && Number(r.price_per_hour) <= 0) return false;
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
    filters.priceType !== 'all' ||
    filters.facilities.length > 0 ||
    filters.favOnly ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-5">
      {/* Compact Hero */}
      <section
        className="overflow-hidden rounded-2xl px-6 py-5 text-white shadow-soft"
        style={{
          backgroundImage: `linear-gradient(95deg, rgba(11, 42, 111, 0.94) 40%, rgba(11, 42, 111, 0.52) 100%), url(/images/feb-hero.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-unnes-gold">
              {nowWib.timeLabel}
            </span>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight">Halo, {user?.name}!</h2>
          </div>

          <div className="flex gap-2.5">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {freeNowCount}
              </div>
              <div className="mt-1 text-[10px] font-medium text-blue-100">Kosong kini</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {filteredRooms.length}
              </div>
              <div className="mt-1 text-[10px] font-medium text-blue-100">Tersedia</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-xl font-extrabold leading-none text-unnes-gold tabular-nums">
                {favorites.size}
              </div>
              <div className="mt-1 text-[10px] font-medium text-blue-100">Favorit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Booking Filter Bar */}
      <section className="sh-card space-y-3.5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <DatePickerPopover
              label="Tanggal"
              days={days}
              value={filters.day}
              onChange={(idx) => updateFilter('day', idx)}
            />
          </div>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jam Mulai</span>
            <select
              value={filters.start}
              onChange={(e) => updateFilter('start', Number(e.target.value))}
              className="sh-input font-semibold"
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)} WIB
                </option>
              ))}
            </select>
          </label>

          {/* Segmented Duration */}
          <div className="lg:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Durasi</span>
            <div className="grid grid-cols-3 rounded-xl border border-unnes-border bg-[#f7faff] p-0.5 dark:border-unnes-border-dark dark:bg-[#0d1730]">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateFilter('dur', d)}
                  className={`rounded-lg py-1.5 text-xs font-extrabold transition ${
                    filters.dur === d
                      ? 'bg-unnes-navy text-unnes-gold shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-slate-600 hover:text-unnes-navy dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
          </div>

          <label className="block lg:col-span-3">
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

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kapasitas</span>
            <select
              value={filters.cap}
              onChange={(e) => updateFilter('cap', Number(e.target.value))}
              className="sh-input"
            >
              <option value={0}>Semua</option>
              <option value={30}>30+ kursi</option>
              <option value={45}>45+ kursi</option>
              <option value={60}>60+ kursi</option>
            </select>
          </label>
        </div>

        {/* Search + Facility + Tarif + Sort Row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-unnes-border/70 pt-3 dark:border-unnes-border-dark">
          <div className="relative min-w-[170px] flex-1 sm:max-w-[210px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Cari kode (L4 512, Lab)..."
              className="sh-input py-1.5 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
              Favorit
            </button>

            <span className="mx-0.5 hidden h-4 w-px bg-unnes-border dark:bg-unnes-border-dark sm:inline-block" />

            {[
              { id: 'all', label: 'Semua Tarif' },
              { id: 'free', label: 'Gratis FEB' },
              { id: 'paid', label: 'Lab' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateFilter('priceType', t.id)}
                className={`sh-chip ${filters.priceType === t.id && t.id !== 'all' ? 'sh-chip-active' : ''} ${
                  filters.priceType === 'all' && t.id === 'all'
                    ? 'border-unnes-navy/40 bg-unnes-surface font-bold dark:border-unnes-blue-light/40 dark:bg-[#19264a]'
                    : ''
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <select
              aria-label="Urutkan ruangan"
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="sh-input w-auto py-1.5 text-xs"
            >
              <option value="cap">Kapasitas terbesar</option>
              <option value="long">Kosong terlama</option>
            </select>

            {hasExtraFilter && (
              <button
                type="button"
                onClick={resetFilters}
                title="Reset filter"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-unnes-surface hover:text-unnes-blue dark:text-slate-400 dark:hover:bg-[#19264a]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3-Column Modern Room Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.code} room={room} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <p className="text-sm font-bold text-[#0f1d3d] dark:text-white">Tidak ada ruang kosong di slot ini.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Coba ganti tanggal, jam mulai, atau reset filter.
          </p>
          <button type="button" onClick={resetFilters} className="sh-btn-secondary mt-4">
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
