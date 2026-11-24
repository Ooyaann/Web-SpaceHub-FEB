import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Clock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { FACILITY_OPTIONS, START_HOURS, getFloorOptions } from '../lib/constants';
import { formatHour } from '../lib/dateWib';
import { getFreeUntilHour, getSlotStatus, isWindowFree } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';
import RoomCard from '../components/RoomCard';
import SkeletonCard from '../components/SkeletonCard';

export default function FindView() {
  const {
    user,
    isAdmin,
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

  const [showFacilities, setShowFacilities] = useState(false);

  const floorOptions = useMemo(
    () => [
      { value: '', label: `Semua Gedung (${rooms.length})` },
      ...getFloorOptions(rooms).map(([key, label]) => ({ value: key, label })),
    ],
    [rooms]
  );

  const hourOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  const capOptions = [
    { value: 0, label: 'Semua Kapasitas' },
    { value: 30, label: '30+ kursi' },
    { value: 45, label: '45+ kursi' },
    { value: 60, label: '60+ kursi' },
  ];

  const priceOptions = [
    { value: 'all', label: 'Semua Tarif' },
    { value: 'free', label: 'Gratis Mahasiswa FEB' },
    { value: 'paid', label: 'Lab / Berbayar' },
  ];

  const sortOptions = [
    { value: 'cap', label: 'Kapasitas terbesar' },
    { value: 'long', label: 'Kosong terlama' },
  ];

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

  const activeFacCount = filters.facilities.length + (filters.favOnly ? 1 : 0);
  const hasAnyExtraFilter =
    Boolean(filters.floorKey) ||
    filters.cap > 0 ||
    filters.priceType !== 'all' ||
    activeFacCount > 0 ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Cari Ruang Kosong
          </h1>
          <p className="mt-1 font-mono text-xs text-[#526382] dark:text-unnes-night-muted">
            {selectedDay.label} · {formatHour(filters.start)} ({filters.dur}j) · {nowWib.timeLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-light bg-white px-3 py-1.5 font-semibold text-[#0F1B33] dark:border-unnes-night-line dark:bg-unnes-night-card dark:text-[#F1F5FB]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <strong className="font-mono">{filteredRooms.length}</strong> tersedia
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-light bg-white px-3 py-1.5 font-medium text-[#526382] dark:border-unnes-night-line dark:bg-unnes-night-card dark:text-unnes-night-muted">
            Kosong kini: <strong className="font-mono text-[#0F1B33] dark:text-[#F1F5FB]">{freeNowCount}</strong>
          </span>
          {!isAdmin && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-light bg-white px-3 py-1.5 font-medium text-[#526382] dark:border-unnes-night-line dark:bg-unnes-night-card dark:text-unnes-night-muted">
              <Star className="h-3.5 w-3.5 fill-unnes-gold text-unnes-gold" />
              <strong className="font-mono text-[#0F1B33] dark:text-[#F1F5FB]">{favorites.size}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Symmetrical 2-Row Filter Bar */}
      <section className="sh-card space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <DatePickerPopover
              label="Tanggal"
              days={days}
              value={filters.day}
              onChange={(idx) => updateFilter('day', idx)}
            />
          </div>

          <div className="lg:col-span-3">
            <SelectPopover
              label="Jam Mulai"
              icon={Clock}
              value={filters.start}
              onChange={(v) => updateFilter('start', Number(v))}
              options={hourOptions}
            />
          </div>

          <div className="lg:col-span-2">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#526382] dark:text-unnes-night-muted">
              Durasi
            </span>
            <div className="grid h-10 grid-cols-3 rounded-lg border border-line-light bg-surface-subtle p-1 dark:border-unnes-night-line dark:bg-unnes-night-input">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateFilter('dur', d)}
                  className={`rounded-md font-mono text-xs font-bold transition ${
                    filters.dur === d
                      ? 'bg-unnes-royal text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#4B5E82] hover:text-[#0F1B33] dark:text-unnes-night-muted dark:hover:text-white'
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#526382] dark:text-unnes-night-muted">
              Cari Kode Ruang
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A7B9C]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Mis. L4 512, Lab 5A..."
                className="sh-control pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-line-light pt-3.5 dark:border-unnes-night-line sm:grid-cols-2 lg:grid-cols-5">
          <SelectPopover
            icon={Building2}
            value={filters.floorKey}
            onChange={(v) => updateFilter('floorKey', v)}
            options={floorOptions}
          />

          <SelectPopover
            icon={Users}
            value={filters.cap}
            onChange={(v) => updateFilter('cap', Number(v))}
            options={capOptions}
          />

          <SelectPopover
            icon={Tag}
            value={filters.priceType}
            onChange={(v) => updateFilter('priceType', v)}
            options={priceOptions}
          />

          <SelectPopover
            icon={ArrowUpDown}
            value={filters.sort}
            onChange={(v) => updateFilter('sort', v)}
            options={sortOptions}
            align="right"
          />

          <button
            type="button"
            onClick={() => setShowFacilities((s) => !s)}
            className={`sh-control flex items-center justify-between gap-2 ${
              showFacilities || activeFacCount > 0
                ? 'border-unnes-royal text-unnes-royal dark:border-unnes-gold dark:text-unnes-gold'
                : ''
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Fasilitas
            </span>
            {activeFacCount > 0 ? (
              <span className="rounded bg-unnes-royal px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-unnes-gold dark:text-unnes-gold-ink">
                {activeFacCount}
              </span>
            ) : (
              <span className="text-xs text-[#6A7B9C] dark:text-unnes-night-muted">
                {showFacilities ? 'Tutup' : 'Pilih'}
              </span>
            )}
          </button>
        </div>

        {(showFacilities || activeFacCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-subtle px-3.5 py-2.5 dark:bg-unnes-night-input">
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

              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => updateFilter('favOnly', !filters.favOnly)}
                  className={`sh-chip ${filters.favOnly ? 'sh-chip-active' : ''}`}
                >
                  <Star className={`h-3.5 w-3.5 ${filters.favOnly ? 'fill-current' : ''}`} />
                  Favorit saja
                </button>
              )}
            </div>

            {hasAnyExtraFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#526382] transition hover:text-unnes-royal dark:text-unnes-night-muted dark:hover:text-unnes-gold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        )}
      </section>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.code} room={room} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-card border-dashed px-6 py-14 text-center">
          <p className="text-sm font-bold text-[#0F1B33] dark:text-[#F1F5FB]">Tidak ada ruang kosong di slot ini.</p>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">
            Ubah tanggal, jam mulai, atau reset filter untuk melihat ruang lain.
          </p>
          <button type="button" onClick={resetFilters} className="sh-btn-secondary mt-4">
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
