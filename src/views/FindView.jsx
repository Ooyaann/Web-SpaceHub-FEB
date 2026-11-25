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

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const floorOptions = useMemo(
    () => [
      { value: '', label: `Semua gedung (${rooms.length})` },
      ...getFloorOptions(rooms).map(([key, label]) => ({ value: key, label })),
    ],
    [rooms]
  );

  const hourOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  const capOptions = [
    { value: 0, label: 'Semua kursi' },
    { value: 30, label: 'Min. 30 kursi' },
    { value: 45, label: 'Min. 45 kursi' },
    { value: 60, label: 'Min. 60 kursi' },
  ];

  const priceOptions = [
    { value: 'all', label: 'Semua tarif' },
    { value: 'free', label: 'Gratis Mahasiswa FEB' },
    { value: 'paid', label: 'Lab / Berbayar' },
  ];

  const sortOptions = [
    { value: 'cap', label: 'Kapasitas terbesar' },
    { value: 'long', label: 'Kosong terlama' },
  ];

  const selectedDay = days[filters.day] || days[0];
  const isOperationalNow = nowWib.hour >= 7 && nowWib.hour <= 16;

  const freeNowCount = useMemo(() => {
    if (!isOperationalNow) return 0;
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
  }, [isOperationalNow, rooms, bookings, reports, user, days, nowWib]);

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

  const extraDropdownCount =
    (filters.floorKey ? 1 : 0) + (filters.cap > 0 ? 1 : 0) + (filters.priceType !== 'all' ? 1 : 0);

  const hasAnyExtraFilter =
    extraDropdownCount > 0 ||
    filters.facilities.length > 0 ||
    filters.favOnly ||
    Boolean(filters.search.trim());

  const maxAllowedDur = Math.min(3, 17 - filters.start);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header — Ringkas di HP, lengkap di Desktop */}
      <div className="flex flex-wrap items-end justify-between gap-2.5 sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
            Cari ruang kelas
          </h1>
          <p className="mt-0.5 text-xs text-[#475467] sm:mt-1 sm:text-[13px] dark:text-[#B0B8C9]">
            <strong className="font-semibold text-[#101828] dark:text-[#F5F7FA]">{selectedDay.label}</strong> · mulai{' '}
            <strong className="font-semibold text-[#101828] dark:text-[#F5F7FA]">{formatHour(filters.start)}</strong> (
            {filters.dur} jam)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium sm:text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE2EC] bg-white px-2.5 py-1 text-[#344054] shadow-sm sm:px-3 sm:py-1.5 dark:border-ink-line dark:bg-ink-card dark:text-[#E2E7F1]">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">
              {filteredRooms.length}
            </strong>{' '}
            tersedia
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE2EC] bg-white px-2.5 py-1 text-[#475467] shadow-sm sm:px-3 sm:py-1.5 dark:border-ink-line dark:bg-ink-card dark:text-[#B0B8C9]">
            <Clock className="h-3.5 w-3.5 text-unnes-navy dark:text-unnes-gold" />
            {isOperationalNow ? (
              <span>
                <strong className="tabular-nums font-bold text-[#101828] dark:text-[#F5F7FA]">{freeNowCount}</strong>{' '}
                kosong kini
              </span>
            ) : (
              <span>07.00–17.00 WIB</span>
            )}
          </span>
        </div>
      </div>

      {/* Unified Search Panel — Compact 2-Column on Mobile so Room Cards stay visible above the fold */}
      <section className="sh-panel space-y-3 p-3.5 sm:space-y-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-12 lg:gap-3">
          <div className="col-span-1 lg:col-span-3">
            <DatePickerPopover
              label="Tanggal"
              days={days}
              value={filters.day}
              onChange={(idx) => updateFilter('day', idx)}
            />
          </div>

          <div className="col-span-1 lg:col-span-3">
            <SelectPopover
              label="Jam mulai"
              icon={Clock}
              value={filters.start}
              onChange={(v) => {
                const nextStart = Number(v);
                updateFilter('start', nextStart);
                if (nextStart + filters.dur > 17) {
                  updateFilter('dur', Math.max(1, 17 - nextStart));
                }
              }}
              options={hourOptions}
            />
          </div>

          <div className="col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Durasi</span>
            <div className="grid h-11 grid-cols-3 rounded-xl border border-[#D8DDE7] bg-[#F2F4F8] p-1 sm:h-10 dark:border-ink-line dark:bg-ink-canvas">
              {[1, 2, 3].map((d) => {
                const disabled = d > maxAllowedDur;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateFilter('dur', d)}
                    className={`rounded-lg text-xs font-semibold tabular-nums transition-all ${
                      filters.dur === d && !disabled
                        ? 'bg-unnes-navy text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                        : 'text-[#475467] hover:text-[#101828] disabled:opacity-35 dark:text-[#B0B8C9] dark:hover:text-[#F5F7FA]'
                    }`}
                  >
                    {d} jam
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 lg:col-span-4">
            <span className="mb-1.5 hidden text-xs font-medium text-[#475467] lg:block dark:text-[#B0B8C9]">
              Cari kode ruang
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Cari ruang (L4 512, Lab)..."
                  className="sh-control pl-9"
                />
              </div>

              {/* Tombol Filter Tambahan khusus Mobile (< lg) */}
              <button
                type="button"
                onClick={() => setMobileMoreOpen((o) => !o)}
                className={`inline-flex h-11 flex-none items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition sm:h-10 lg:hidden ${
                  mobileMoreOpen || extraDropdownCount > 0
                    ? 'border-unnes-navy bg-[#EEF3FC] text-unnes-navy dark:border-unnes-gold dark:bg-ink-subtle dark:text-unnes-gold'
                    : 'border-[#D8DDE7] bg-white text-[#344054] dark:border-ink-line dark:bg-ink-subtle dark:text-[#E2E7F1]'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filter</span>
                {extraDropdownCount > 0 && (
                  <span className="rounded-full bg-unnes-navy px-1.5 py-0.5 text-[10px] text-white dark:bg-unnes-gold dark:text-unnes-gold-ink">
                    {extraDropdownCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Refinements: Selalu tampil di Desktop (lg+), Collapsible rapi di Smartphone */}
        <div
          className={`grid-cols-2 gap-2.5 border-t border-[#ECEFF4] pt-3.5 dark:border-ink-line lg:grid lg:grid-cols-4 lg:pt-4 ${
            mobileMoreOpen ? 'grid animate-view-in' : 'hidden'
          }`}
        >
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
        </div>

        {/* Horizontal Swipeable Chips di Smartphone, Wrap di Desktop */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 sm:flex-wrap">
            {FACILITY_OPTIONS.map((fac) => {
              const active = filters.facilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => toggleFacilityFilter(fac)}
                  className={`sh-chip flex-none ${active ? 'sh-chip-active' : ''}`}
                >
                  {fac}
                </button>
              );
            })}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => updateFilter('favOnly', !filters.favOnly)}
                className={`sh-chip flex-none ${filters.favOnly ? 'sh-chip-active' : ''}`}
              >
                <Star className={`h-3.5 w-3.5 ${filters.favOnly ? 'fill-current' : ''}`} />
                Favorit
              </button>
            )}
          </div>

          {hasAnyExtraFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex flex-none items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-unnes-navy transition hover:bg-[#EEF3FC] dark:text-unnes-gold dark:hover:bg-ink-subtle"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset filter</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.code} room={room} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="sh-panel px-4 py-12 text-center sm:py-16">
          <p className="text-[15px] font-bold text-[#101828] dark:text-[#F5F7FA]">
            Tidak ada ruang kosong untuk filter ini
          </p>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Coba geser jam mulai, pilih tanggal lain, atau kurangi filter fasilitas.
          </p>
          <button type="button" onClick={resetFilters} className="sh-btn-secondary mt-5">
            <RotateCcw className="h-4 w-4" />
            Reset semua filter
          </button>
        </div>
      )}
    </div>
  );
}
