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
    { value: 0, label: 'Semua kapasitas' },
    { value: 30, label: '30+ kursi' },
    { value: 45, label: '45+ kursi' },
    { value: 60, label: '60+ kursi' },
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
    <div className="space-y-8">
      {/* Header + Filter duduk langsung di kanvas bersih (tanpa box-in-box) */}
      <div className="space-y-6 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
              Cari ruang
            </h1>
            <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
              {selectedDay.label}, {formatHour(filters.start)} ({filters.dur} jam) · {nowWib.timeLabel}
            </p>
          </div>

          <div className="flex items-center gap-5 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            <span>
              <strong className="tabular-nums font-semibold text-[#141923] dark:text-[#EEF2F7]">
                {filteredRooms.length}
              </strong>{' '}
              tersedia
            </span>
            <span>
              <strong className="tabular-nums font-semibold text-[#141923] dark:text-[#EEF2F7]">
                {freeNowCount}
              </strong>{' '}
              kosong kini
            </span>
          </div>
        </div>

        {/* Row 1 */}
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
              label="Jam mulai"
              icon={Clock}
              value={filters.start}
              onChange={(v) => updateFilter('start', Number(v))}
              options={hourOptions}
            />
          </div>

          <div className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">Durasi</span>
            <div className="grid h-10 grid-cols-3 rounded-lg bg-[#F1F3F7] p-1 dark:bg-ink-card">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateFilter('dur', d)}
                  className={`rounded-md text-xs font-semibold tabular-nums transition ${
                    filters.dur === d
                      ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : 'text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]'
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <span className="mb-1.5 block text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
              Cari kode ruang
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B869B]" />
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

        {/* Row 2 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                ? 'border-unnes-navy text-unnes-navy dark:border-unnes-gold dark:text-unnes-gold'
                : ''
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Fasilitas
            </span>
            <span className="tabular-nums text-xs text-[#7B869B] dark:text-[#9AA7BE]">
              {activeFacCount > 0 ? `${activeFacCount} aktif` : showFacilities ? 'Tutup' : 'Pilih'}
            </span>
          </button>
        </div>

        {(showFacilities || activeFacCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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
                className="inline-flex items-center gap-1 text-xs font-medium text-[#5B667B] hover:text-[#141923] dark:text-[#9AA7BE] dark:hover:text-[#EEF2F7]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Airbnb-style 3-column Room Grid */}
      {loading ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.code} room={room} dayIndex={filters.day} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[15px] font-semibold text-[#141923] dark:text-[#EEF2F7]">
            Tidak ada ruang kosong di slot ini
          </p>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Coba pilih tanggal atau jam mulai lain.
          </p>
          <button type="button" onClick={resetFilters} className="sh-btn-secondary mt-4">
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}
