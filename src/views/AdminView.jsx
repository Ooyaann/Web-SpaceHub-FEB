import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Clock,
  DoorOpen,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { FACILITY_OPTIONS, OPERATIONAL_HOURS, ROOM_IMAGES, START_HOURS } from '../lib/constants';
import { formatDateKeyLabel, formatHour, formatHourRange, formatPriceBadge } from '../lib/dateWib';
import { getRawSlotStatus, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';

const EMPTY_ROOM_FORM = {
  originalCode: '',
  code: '',
  building: 'L4',
  floor: 2,
  capacity: 45,
  facilities: ['AC', 'Proyektor', 'WiFi'],
  pricePerHour: 0,
  priceNote: 'Mahasiswa FEB gratis · Umum Rp 50.000/jam',
  description: '',
  imageUrl: ROOM_IMAGES[0],
};

export default function AdminView() {
  const {
    rooms,
    bookings,
    reports,
    days,
    nowWib,
    user,
    adminSaveRoom,
    adminRemoveRoom,
    adminCreateBlock,
    adminManageStatus,
    reportRoomUsed,
  } = useSpaceHub();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [tab, setTab] = useState('bookings');

  // Bookings tab state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmBookingAction, setConfirmBookingAction] = useState(null);

  // Faculty block form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockRoom, setBlockRoom] = useState(rooms[0]?.code || 'L2 301');
  const [blockDayIdx, setBlockDayIdx] = useState(0);
  const [blockStart, setBlockStart] = useState(9);
  const [blockDur, setBlockDur] = useState(2);
  const [blockPic, setBlockPic] = useState('Tata Usaha FEB');
  const [blockPurpose, setBlockPurpose] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  // Rooms CRUD state
  const [roomSearch, setRoomSearch] = useState('');
  const [roomBuildingFilter, setRoomBuildingFilter] = useState('ALL');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM);
  const [savingRoom, setSavingRoom] = useState(false);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null);

  // Quick report form
  const [repRoom, setRepRoom] = useState(rooms[0]?.code || 'L2 301');
  const [repDayIdx, setRepDayIdx] = useState(0);
  const [repHour, setRepHour] = useState(10);

  const targetDay = days[selectedDayIdx] || days[0];

  const statusOptions = [
    { value: 'all', label: 'Semua status' },
    { value: 'confirmed', label: 'Confirmed (Aktif/Selesai)' },
    { value: 'cancelled', label: 'Cancelled (Batal)' },
  ];

  const buildingFilterOptions = [
    { value: 'ALL', label: `Semua gedung (${rooms.length})` },
    { value: 'L2', label: 'Gedung L2' },
    { value: 'L4', label: 'Gedung L4' },
    { value: 'L5', label: 'Gedung L5' },
  ];

  const buildingFormOptions = [
    { value: 'L2', label: 'Gedung L2' },
    { value: 'L4', label: 'Gedung L4' },
    { value: 'L5', label: 'Gedung L5' },
  ];

  const roomSelectOptions = useMemo(
    () => rooms.map((r) => ({ value: r.code, label: `${r.code} (${r.capacity} kursi)` })),
    [rooms]
  );

  const hourSelectOptions = useMemo(
    () => START_HOURS.map((h) => ({ value: h, label: `${formatHour(h)} WIB` })),
    []
  );

  const stats = useMemo(() => {
    const activeBookings = bookings.filter((b) => isBookingActive(b, nowWib.dateKey, nowWib.hour));
    const totalSlots = rooms.length * OPERATIONAL_HOURS.length;
    let occupiedSlots = 0;

    const buildingMap = new Map();
    for (const r of rooms) {
      if (!buildingMap.has(r.building)) {
        buildingMap.set(r.building, {
          building: r.building,
          roomCount: 0,
          totalSlots: 0,
          occupiedSlots: 0,
          bookedSlots: 0,
          classSlots: 0,
        });
      }
      const entry = buildingMap.get(r.building);
      entry.roomCount += 1;
      entry.totalSlots += OPERATIONAL_HOURS.length;

      for (const h of OPERATIONAL_HOURS) {
        const st = getRawSlotStatus({
          roomCode: r.code,
          dateKey: targetDay.key,
          weekday: targetDay.weekday,
          hour: h,
          bookings,
          reports,
          userEmail: user?.email,
        });
        if (st !== 'f') {
          occupiedSlots += 1;
          entry.occupiedSlots += 1;
          if (st === 'k') entry.classSlots += 1;
          else entry.bookedSlots += 1;
        }
      }
    }

    const occupancyPct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    return {
      totalRooms: rooms.length,
      activeBookingsCount: activeBookings.length,
      occupancyPct,
      totalReports: reports.length,
      buildings: Array.from(buildingMap.values()).map((b) => ({
        ...b,
        pct: b.totalSlots > 0 ? Math.round((b.occupiedSlots / b.totalSlots) * 100) : 0,
      })),
    };
  }, [rooms, bookings, reports, targetDay, nowWib, user]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (
        q &&
        !(b.id || '').toLowerCase().includes(q) &&
        !(b.room_code || '').toLowerCase().includes(q) &&
        !(b.nim || '').toLowerCase().includes(q) &&
        !(b.user_name || '').toLowerCase().includes(q) &&
        !(b.purpose || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return rooms.filter((r) => {
      if (roomBuildingFilter !== 'ALL' && r.building !== roomBuildingFilter) return false;
      if (q && !r.code.toLowerCase().includes(q) && !r.location_label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rooms, roomBuildingFilter, roomSearch]);

  const openCreateRoom = () => {
    setRoomForm(EMPTY_ROOM_FORM);
    setShowRoomModal(true);
  };

  const openEditRoom = (r) => {
    setRoomForm({
      originalCode: r.code,
      code: r.code,
      building: r.building,
      floor: r.floor,
      capacity: r.capacity,
      facilities: Array.isArray(r.facilities) ? [...r.facilities] : [],
      pricePerHour: Number(r.price_per_hour) || 0,
      priceNote: r.price_note || '',
      description: r.description || '',
      imageUrl: r.image_url || ROOM_IMAGES[0],
    });
    setShowRoomModal(true);
  };

  const toggleFormFacility = (fac) => {
    setRoomForm((prev) => {
      const exists = prev.facilities.includes(fac);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((f) => f !== fac) : [...prev.facilities, fac],
      };
    });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);
    try {
      const res = await adminSaveRoom(roomForm);
      if (res?.ok) setShowRoomModal(false);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    if (!blockPurpose.trim()) return;
    setBlockSubmitting(true);
    try {
      const dObj = days[blockDayIdx] || days[0];
      const maxAllowedDur = Math.min(blockDur, 17 - Number(blockStart));
      const res = await adminCreateBlock({
        roomCode: blockRoom,
        bookingDate: dObj.key,
        startHour: Number(blockStart),
        duration: maxAllowedDur,
        purpose: blockPurpose.trim(),
        picName: blockPic.trim() || 'Pengelola FEB',
      });
      if (res?.ok) {
        setBlockPurpose('');
        setShowBlockForm(false);
      }
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleQuickReport = async (e) => {
    e.preventDefault();
    const dObj = days[repDayIdx] || days[0];
    await reportRoomUsed(repRoom, dObj.key, Number(repHour));
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header & Quick Actions — Responsif penuh di Smartphone */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
            Dashboard pengelola
          </h1>
          <p className="mt-0.5 text-xs text-[#475467] sm:mt-1 sm:text-[13px] dark:text-[#B0B8C9]">
            Kelola master ruangan & tarif, pantau/batalkan booking, blokir jadwal fakultas, dan laporan lapangan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">
          <div className="col-span-2 sm:w-48">
            <DatePickerPopover
              label="Tanggal analitik"
              days={days}
              value={selectedDayIdx}
              onChange={(idx) => setSelectedDayIdx(idx)}
              align="right"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('bookings');
              setShowBlockForm((s) => !s);
            }}
            className="sh-btn-secondary text-xs"
          >
            <CalendarPlus className="h-4 w-4 text-unnes-navy dark:text-unnes-gold" />
            Blokir jadwal
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('rooms');
              openCreateRoom();
            }}
            className="sh-btn-primary text-xs"
          >
            <Plus className="h-4 w-4" />
            Tambah ruang
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setTab('rooms')}
          className="sh-panel p-3.5 text-left transition hover:border-unnes-navy sm:p-4 dark:hover:border-unnes-gold"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] sm:text-xs dark:text-[#B0B8C9]">
            <span>Total ruang</span>
            <Building2 className="h-4 w-4 text-[#667085] dark:text-[#8A93A6]" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-[#101828] sm:mt-2 sm:text-2xl dark:text-[#F5F7FA]">
            {stats.totalRooms}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-unnes-navy dark:text-unnes-gold">Kelola ruangan →</div>
        </button>

        <button
          type="button"
          onClick={() => setTab('bookings')}
          className="sh-panel p-3.5 text-left transition hover:border-unnes-navy sm:p-4 dark:hover:border-unnes-gold"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] sm:text-xs dark:text-[#B0B8C9]">
            <span>Booking aktif</span>
            <CalendarCheck2 className="h-4 w-4 text-[#16A34A] dark:text-[#22C55E]" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-[#101828] sm:mt-2 sm:text-2xl dark:text-[#F5F7FA]">
            {stats.activeBookingsCount}
          </div>
          <div className="mt-1 text-[11px] text-[#667085] dark:text-[#8A93A6]">Dari {bookings.length} catatan</div>
        </button>

        <div className="sh-panel p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] sm:text-xs dark:text-[#B0B8C9]">
            <span>Keterisian ({targetDay.shortDate})</span>
            <BarChart3 className="h-4 w-4 text-unnes-navy dark:text-unnes-gold" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-[#101828] sm:mt-2 sm:text-2xl dark:text-[#F5F7FA]">
            {stats.occupancyPct}%
          </div>
          <div className="mt-1 text-[11px] text-[#667085] dark:text-[#8A93A6]">Kuliah + booking</div>
        </div>

        <button
          type="button"
          onClick={() => setTab('reports')}
          className="sh-panel p-3.5 text-left transition hover:border-unnes-navy sm:p-4 dark:hover:border-unnes-gold"
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] sm:text-xs dark:text-[#B0B8C9]">
            <span>Laporan lapangan</span>
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-1.5 font-mono text-xl font-bold tabular-nums text-[#101828] sm:mt-2 sm:text-2xl dark:text-[#F5F7FA]">
            {stats.totalReports}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#B45309] dark:text-[#FBBF24]">Tindak lanjuti →</div>
        </button>
      </div>

      {/* Building Occupancy */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {stats.buildings.map((b) => (
          <div key={b.building} className="sh-panel p-3.5 sm:p-4">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-semibold text-[#101828] dark:text-[#F5F7FA]">
                Gedung {b.building}{' '}
                <span className="font-normal text-[#667085] dark:text-[#8A93A6]">({b.roomCount} ruang)</span>
              </span>
              <span className="font-mono font-bold tabular-nums text-unnes-navy dark:text-unnes-gold">{b.pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EAEEF4] dark:bg-ink-subtle">
              <div
                className="h-full rounded-full bg-unnes-navy transition-all dark:bg-unnes-gold"
                style={{ width: `${b.pct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-[#475467] dark:text-[#B0B8C9]">
              <span>Kuliah: {b.classSlots} slot</span>
              <span>Terpakai: {b.bookedSlots} slot</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main CRUD Workspace Panel */}
      <section className="sh-panel overflow-hidden">
        {/* Workspace Tabs + Search/Filter */}
        <div className="space-y-3 border-b border-[#ECEFF4] p-3.5 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:space-y-0 sm:px-5 sm:py-4 dark:border-ink-line">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setTab('bookings')}
              className={`sh-chip flex-none ${tab === 'bookings' ? 'sh-chip-active' : ''}`}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Booking ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('rooms')}
              className={`sh-chip flex-none ${tab === 'rooms' ? 'sh-chip-active' : ''}`}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Ruang & Tarif ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('reports')}
              className={`sh-chip flex-none ${tab === 'reports' ? 'sh-chip-active' : ''}`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Laporan ({reports.length})
            </button>
          </div>

          {tab === 'bookings' && (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode / NIM / ruang..."
                  className="sh-control w-full pl-9 sm:w-48"
                />
              </div>
              <div className="w-full sm:w-44">
                <SelectPopover
                  icon={Filter}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                  options={statusOptions}
                  align="right"
                />
              </div>
            </div>
          )}

          {tab === 'rooms' && (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Cari ruang (L4 512, Lab)..."
                  className="sh-control w-full pl-9 sm:w-48"
                />
              </div>
              <div className="w-full sm:w-44">
                <SelectPopover
                  icon={Building2}
                  value={roomBuildingFilter}
                  onChange={(v) => setRoomBuildingFilter(v)}
                  options={buildingFilterOptions}
                  align="right"
                />
              </div>
            </div>
          )}
        </div>

        {/* Inline Faculty Block Form */}
        {tab === 'bookings' && showBlockForm && (
          <form
            onSubmit={handleCreateBlock}
            className="animate-view-in border-b border-[#ECEFF4] bg-[#F8FAFC] p-4 sm:p-5 dark:border-ink-line dark:bg-ink-canvas/60"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">
                  Blokir / Booking Ruang oleh Pengelola
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#8A93A6]">
                  Untuk ujian susulan, rapat dosen, kuliah pengganti, atau perawatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockForm(false)}
                className="rounded-lg p-1.5 text-[#667085] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <div className="col-span-2 lg:col-span-2">
                <SelectPopover
                  label="Ruangan"
                  icon={DoorOpen}
                  value={blockRoom}
                  onChange={(v) => setBlockRoom(v)}
                  options={roomSelectOptions}
                />
              </div>
              <div className="col-span-2 lg:col-span-2">
                <DatePickerPopover
                  label="Tanggal"
                  days={days}
                  value={blockDayIdx}
                  onChange={(idx) => setBlockDayIdx(idx)}
                />
              </div>
              <div className="col-span-1">
                <SelectPopover
                  label="Jam mulai"
                  icon={Clock}
                  value={blockStart}
                  onChange={(v) => setBlockStart(Number(v))}
                  options={hourSelectOptions}
                />
              </div>
              <div className="col-span-1">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Durasi</span>
                <div className="grid h-11 grid-cols-3 rounded-xl border border-[#D8DDE7] bg-white p-1 sm:h-10 dark:border-ink-line dark:bg-ink-subtle">
                  {[1, 2, 3].map((d) => {
                    const disabled = Number(blockStart) + d > 17;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={disabled}
                        onClick={() => setBlockDur(d)}
                        className={`rounded-lg text-xs font-semibold ${
                          blockDur === d && !disabled
                            ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                            : 'text-[#475467] disabled:opacity-30 dark:text-[#B0B8C9]'
                        }`}
                      >
                        {d}j
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-12 sm:gap-3">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={blockPic}
                  onChange={(e) => setBlockPic(e.target.value)}
                  placeholder="Unit / Penanggung jawab"
                  className="sh-control"
                />
              </div>
              <div className="sm:col-span-6">
                <input
                  type="text"
                  required
                  value={blockPurpose}
                  onChange={(e) => setBlockPurpose(e.target.value)}
                  placeholder="Keperluan blokir (mis. Ujian Susulan / Maintenance)"
                  className="sh-control"
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={blockSubmitting} className="sh-btn-primary w-full text-xs">
                  {blockSubmitting ? 'Menyimpan...' : 'Simpan blokir'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 1: BOOKINGS (Mobile Cards + Desktop Table) */}
        {tab === 'bookings' && (
          filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-[#475467] dark:text-[#B0B8C9]">
              Tidak ada data booking yang cocok dengan pencarian.
            </div>
          ) : (
            <>
              {/* Mobile Booking Cards (< md) */}
              <div className="divide-y divide-[#ECEFF4] md:hidden dark:divide-ink-line">
                {filteredBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  return (
                    <div key={b.id} className="space-y-2.5 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">
                            {b.room_code}
                          </span>
                          <span className="font-mono text-xs font-semibold text-unnes-navy dark:text-unnes-gold">
                            {b.id}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            isConfirmed
                              ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5]'
                              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-[#2E1C22] dark:text-rose-300'
                          }`}
                        >
                          {isConfirmed ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-[#344054] dark:text-[#D0D7E6]">
                        {formatDateKeyLabel(b.booking_date, days)} ·{' '}
                        <span className="font-mono">{formatHourRange(b.start_hour, b.duration)}</span>
                      </div>

                      <div className="text-xs text-[#667085] dark:text-[#B0B8C9]">
                        <strong className="text-[#101828] dark:text-[#F5F7FA]">{b.user_name}</strong> ({b.nim}) ·{' '}
                        {b.purpose}
                      </div>

                      <div className="pt-1">
                        {confirmBookingAction === b.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmBookingAction(null)}
                              className="sh-btn-secondary h-9 flex-1 text-xs"
                            >
                              Tidak
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await adminManageStatus(
                                  isConfirmed ? 'cancel_booking' : 'delete_booking',
                                  b.id,
                                  isConfirmed ? `Booking ${b.id} dibatalkan pengelola.` : `Catatan ${b.id} dihapus.`
                                );
                                setConfirmBookingAction(null);
                              }}
                              className="h-9 flex-1 rounded-xl bg-rose-600 text-xs font-semibold text-white active:scale-95"
                            >
                              Ya, {isConfirmed ? 'Batalkan' : 'Hapus'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmBookingAction(b.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EE] bg-[#F8F9FB] px-3 py-1.5 text-xs font-semibold text-rose-600 active:scale-95 dark:border-ink-line dark:bg-ink-subtle dark:text-rose-400"
                          >
                            {isConfirmed ? (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                Batalkan booking
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus catatan
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Booking Table (md+) */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead className="border-b border-[#ECEFF4] bg-[#F8F9FB] text-xs font-semibold text-[#475467] dark:border-ink-line dark:bg-ink-subtle dark:text-[#B0B8C9]">
                    <tr>
                      <th className="px-5 py-3">Kode</th>
                      <th className="px-4 py-3">Ruang</th>
                      <th className="px-4 py-3">Jadwal</th>
                      <th className="px-4 py-3">Peminjam</th>
                      <th className="px-4 py-3">Keperluan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Aksi Pengelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEFF4] dark:divide-ink-line/70">
                    {filteredBookings.map((b) => {
                      const isConfirmed = b.status === 'confirmed';
                      return (
                        <tr key={b.id} className="hover:bg-[#F8F9FB] dark:hover:bg-ink-subtle/40">
                          <td className="px-5 py-3 font-mono text-xs font-bold tabular-nums text-unnes-navy dark:text-unnes-gold">
                            {b.id}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#101828] dark:text-[#F5F7FA]">
                            {b.room_code}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#101828] dark:text-[#F5F7FA]">
                              {formatDateKeyLabel(b.booking_date, days)}
                            </span>
                            <span className="ml-1.5 font-mono text-xs tabular-nums text-[#667085] dark:text-[#8A93A6]">
                              {formatHourRange(b.start_hour, b.duration)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#101828] dark:text-[#F5F7FA]">{b.user_name}</div>
                            <div className="font-mono text-[11px] text-[#667085] dark:text-[#8A93A6]">
                              {b.nim} · {b.participants} org
                            </div>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-[#475467] dark:text-[#B0B8C9]">
                            {b.purpose}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                isConfirmed
                                  ? 'border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5]'
                                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-[#2E1C22] dark:text-rose-300'
                              }`}
                            >
                              {isConfirmed ? 'Confirmed' : 'Cancelled'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {confirmBookingAction === b.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setConfirmBookingAction(null)}
                                  className="rounded-lg border border-[#D8DDE7] px-2 py-1 text-xs font-medium dark:border-ink-line"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await adminManageStatus(
                                      isConfirmed ? 'cancel_booking' : 'delete_booking',
                                      b.id,
                                      isConfirmed ? `Booking ${b.id} dibatalkan pengelola.` : `Catatan ${b.id} dihapus.`
                                    );
                                    setConfirmBookingAction(null);
                                  }}
                                  className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                                >
                                  Ya, {isConfirmed ? 'Batalkan' : 'Hapus'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmBookingAction(b.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#E4E7EE] bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-ink-line dark:bg-ink-subtle dark:text-rose-400"
                              >
                                {isConfirmed ? (
                                  <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    Batalkan
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Hapus
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* TAB 2: ROOMS & TARIFF CRUD (Mobile Cards + Desktop Table) */}
        {tab === 'rooms' && (
          <>
            {/* Mobile Room CRUD Cards (< md) */}
            <div className="divide-y divide-[#ECEFF4] md:hidden dark:divide-ink-line">
              {filteredRooms.map((r) => {
                const isPaid = Number(r.price_per_hour) > 0;
                return (
                  <div key={r.code} className="space-y-2.5 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">{r.code}</span>
                        <span className="ml-2 text-xs text-[#667085] dark:text-[#8A93A6]">
                          {r.location_label} · {r.capacity} kursi
                        </span>
                      </div>
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                          isPaid
                            ? 'border-[#FDE68A] bg-[#FEF8E6] text-[#92400E] dark:border-unnes-gold/35 dark:bg-[#2F2817] dark:text-unnes-gold'
                            : 'border-[#D5E0F6] bg-[#EEF3FC] text-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#E5EAF5]'
                        }`}
                      >
                        {isPaid ? formatPriceBadge(r.price_per_hour) : 'Gratis FEB'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(r.facilities || []).map((f) => (
                        <span
                          key={f}
                          className="rounded bg-[#F2F4F8] px-2 py-0.5 text-[11px] font-medium text-[#475467] dark:bg-ink-subtle dark:text-[#B8C0D2]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    {confirmDeleteRoom === r.code ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRoom(null)}
                          className="sh-btn-secondary h-9 flex-1 text-xs"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await adminRemoveRoom(r.code);
                            setConfirmDeleteRoom(null);
                          }}
                          className="h-9 flex-1 rounded-xl bg-rose-600 text-xs font-semibold text-white active:scale-95"
                        >
                          Hapus permanen
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditRoom(r)}
                          className="sh-btn-secondary h-9 flex-1 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit ruang & tarif
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRoom(r.code)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E4E7EE] px-3 text-xs font-semibold text-rose-600 active:scale-95 dark:border-ink-line dark:bg-ink-subtle dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Room Table (md+) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="border-b border-[#ECEFF4] bg-[#F8F9FB] text-xs font-semibold text-[#475467] dark:border-ink-line dark:bg-ink-subtle dark:text-[#B0B8C9]">
                  <tr>
                    <th className="px-5 py-3">Ruang</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Kursi</th>
                    <th className="px-4 py-3">Fasilitas</th>
                    <th className="px-4 py-3">Tarif</th>
                    <th className="px-5 py-3 text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFF4] dark:divide-ink-line/70">
                  {filteredRooms.map((r) => {
                    const isPaid = Number(r.price_per_hour) > 0;
                    return (
                      <tr key={r.code} className="hover:bg-[#F8F9FB] dark:hover:bg-ink-subtle/40">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-[#101828] dark:text-[#F5F7FA]">
                          {r.code}
                        </td>
                        <td className="px-4 py-3 text-[#475467] dark:text-[#B0B8C9]">{r.location_label}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums">{r.capacity}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(r.facilities || []).map((f) => (
                              <span
                                key={f}
                                className="rounded bg-[#F2F4F8] px-1.5 py-0.5 text-[11px] font-medium text-[#475467] dark:bg-ink-subtle dark:text-[#B8C0D2]"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-lg border px-2 py-0.5 text-xs font-semibold ${
                              isPaid
                                ? 'border-[#FDE68A] bg-[#FEF8E6] text-[#92400E] dark:border-unnes-gold/35 dark:bg-[#2F2817] dark:text-unnes-gold'
                                : 'border-[#D5E0F6] bg-[#EEF3FC] text-unnes-navy dark:border-ink-line-strong dark:bg-ink-subtle dark:text-[#E5EAF5]'
                            }`}
                          >
                            {formatPriceBadge(r.price_per_hour)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {confirmDeleteRoom === r.code ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteRoom(null)}
                                className="rounded-lg border border-[#D8DDE7] px-2 py-1 text-xs font-medium dark:border-ink-line"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await adminRemoveRoom(r.code);
                                  setConfirmDeleteRoom(null);
                                }}
                                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                Hapus permanen
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditRoom(r)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#D8DDE7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2636] transition hover:border-unnes-navy hover:text-unnes-navy dark:border-ink-line dark:bg-ink-subtle dark:text-[#F0F3F8] dark:hover:border-unnes-gold dark:hover:text-unnes-gold"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteRoom(r.code)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#E4E7EE] bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-ink-line dark:bg-ink-subtle dark:text-rose-400"
                              >
                                <Trash2 className="h-3 w-3" />
                                Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 3: FIELD REPORTS (Mobile Cards + Desktop Table) */}
        {tab === 'reports' && (
          <div>
            <form
              onSubmit={handleQuickReport}
              className="grid grid-cols-2 gap-2.5 border-b border-[#ECEFF4] bg-[#F8FAFC] p-3.5 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:p-4 dark:border-ink-line dark:bg-ink-canvas/60"
            >
              <div className="col-span-2 sm:w-52">
                <SelectPopover
                  label="Catat ruang terpakai"
                  icon={DoorOpen}
                  value={repRoom}
                  onChange={(v) => setRepRoom(v)}
                  options={roomSelectOptions}
                />
              </div>
              <div className="col-span-1 sm:w-48">
                <DatePickerPopover
                  label="Tanggal"
                  days={days}
                  value={repDayIdx}
                  onChange={(idx) => setRepDayIdx(idx)}
                />
              </div>
              <div className="col-span-1 sm:w-40">
                <SelectPopover
                  label="Jam"
                  icon={Clock}
                  value={repHour}
                  onChange={(v) => setRepHour(Number(v))}
                  options={hourSelectOptions}
                />
              </div>
              <button type="submit" className="sh-btn-primary col-span-2 text-xs sm:w-auto">
                <Plus className="h-4 w-4" />
                Tandai terpakai
              </button>
            </form>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-[#475467] dark:text-[#B0B8C9]">
                Tidak ada laporan lapangan aktif. Semua ruang sesuai jadwal reguler.
              </div>
            ) : (
              <>
                {/* Mobile Report Cards (< md) */}
                <div className="divide-y divide-[#ECEFF4] md:hidden dark:divide-ink-line">
                  {reports.map((r) => (
                    <div key={r.id} className="space-y-2.5 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">
                          {r.room_code}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#9A3412] dark:text-[#FDBA74]">
                          {formatDateKeyLabel(r.report_date, days)} · {formatHour(r.report_hour)} WIB
                        </span>
                      </div>
                      <div className="text-xs text-[#667085] dark:text-[#B0B8C9]">Pelapor: {r.reported_by}</div>
                      <button
                        type="button"
                        onClick={() =>
                          adminManageStatus(
                            'resolve_report',
                            r.id,
                            `Laporan ${r.room_code} diselesaikan, slot dibuka kembali.`
                          )
                        }
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] text-xs font-semibold text-[#166534] active:scale-[0.98] dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Selesaikan (Buka Ruang)
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Report Table (md+) */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead className="border-b border-[#ECEFF4] bg-[#F8F9FB] text-xs font-semibold text-[#475467] dark:border-ink-line dark:bg-ink-subtle dark:text-[#B0B8C9]">
                      <tr>
                        <th className="px-5 py-3">Ruang</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Jam</th>
                        <th className="px-4 py-3">Pelapor</th>
                        <th className="px-5 py-3 text-right">Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEFF4] dark:divide-ink-line/70">
                      {reports.map((r) => (
                        <tr key={r.id} className="hover:bg-[#F8F9FB] dark:hover:bg-ink-subtle/40">
                          <td className="px-5 py-3 font-mono text-xs font-bold text-[#101828] dark:text-[#F5F7FA]">
                            {r.room_code}
                          </td>
                          <td className="px-4 py-3 text-[#101828] dark:text-[#F5F7FA]">
                            {formatDateKeyLabel(r.report_date, days)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-[#9A3412] dark:text-[#FDBA74]">
                            {formatHour(r.report_hour)} WIB
                          </td>
                          <td className="px-4 py-3 text-[#475467] dark:text-[#B0B8C9]">{r.reported_by}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                adminManageStatus(
                                  'resolve_report',
                                  r.id,
                                  `Laporan ${r.room_code} diselesaikan, slot dibuka kembali.`
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-3 py-1.5 text-xs font-semibold text-[#166534] transition hover:bg-[#16A34A] hover:text-white dark:border-[#22C55E]/40 dark:bg-[#14532D] dark:text-[#ECFDF5] dark:hover:bg-[#22C55E] dark:hover:text-[#052E16]"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Selesaikan (Buka Ruang)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Modal Tambah / Edit Ruangan & Tarif — Bottom Sheet di Smartphone, Modal Tengah di Desktop */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <form
            onSubmit={handleSaveRoom}
            className="animate-sheet-in max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-2xl border border-[#E4E7EE] bg-white p-4 shadow-popover sm:rounded-2xl sm:p-6 dark:border-ink-line-strong dark:bg-ink-card"
          >
            <div className="flex items-center justify-between border-b border-[#ECEFF4] pb-3.5 dark:border-ink-line">
              <div>
                <h2 className="text-base font-bold text-[#101828] sm:text-lg dark:text-[#F5F7FA]">
                  {roomForm.originalCode ? `Edit Ruang ${roomForm.originalCode}` : 'Tambah Ruangan Baru'}
                </h2>
                <p className="text-xs text-[#667085] dark:text-[#8A93A6]">
                  Atur kode ruang, kapasitas, fasilitas, dan tarif pemakaian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className="rounded-lg p-1.5 text-[#667085] hover:bg-[#F2F4F8] dark:hover:bg-ink-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              <label className="col-span-2 block sm:col-span-1">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                  Kode ruangan
                </span>
                <input
                  type="text"
                  required
                  value={roomForm.code}
                  onChange={(e) => setRoomForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="Mis. L4 305 atau L4 Lab 5C"
                  className="sh-control font-mono"
                />
              </label>

              <div className="col-span-2 sm:col-span-1">
                <SelectPopover
                  label="Gedung"
                  icon={Building2}
                  value={roomForm.building}
                  onChange={(v) => setRoomForm((p) => ({ ...p, building: v }))}
                  options={buildingFormOptions}
                />
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Lantai</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm((p) => ({ ...p, floor: Number(e.target.value) }))}
                  className="sh-control font-mono tabular-nums"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                  Kapasitas kursi
                </span>
                <input
                  type="number"
                  min={5}
                  max={300}
                  required
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                  className="sh-control font-mono tabular-nums"
                />
              </label>

              <label className="col-span-2 block sm:col-span-1">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                  Tarif per jam (Rp · 0 = Gratis FEB)
                </span>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={roomForm.pricePerHour}
                  onChange={(e) => setRoomForm((p) => ({ ...p, pricePerHour: Number(e.target.value) }))}
                  className="sh-control font-mono tabular-nums"
                />
              </label>

              <label className="col-span-2 block sm:col-span-1">
                <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                  Keterangan tarif
                </span>
                <input
                  type="text"
                  value={roomForm.priceNote}
                  onChange={(e) => setRoomForm((p) => ({ ...p, priceNote: e.target.value }))}
                  placeholder="Mahasiswa FEB gratis · Umum Rp 50.000/jam"
                  className="sh-control"
                />
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">Fasilitas</span>
              <div className="flex flex-wrap gap-1.5">
                {FACILITY_OPTIONS.map((fac) => {
                  const active = roomForm.facilities.includes(fac);
                  return (
                    <button
                      key={fac}
                      type="button"
                      onClick={() => toggleFormFacility(fac)}
                      className={`sh-chip ${active ? 'sh-chip-active' : ''}`}
                    >
                      {fac}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                Pilih foto ruangan
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ROOM_IMAGES.map((imgUrl, idx) => (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setRoomForm((p) => ({ ...p, imageUrl: imgUrl }))}
                    className={`overflow-hidden rounded-lg border-2 transition ${
                      roomForm.imageUrl === imgUrl
                        ? 'border-unnes-navy dark:border-unnes-gold'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Preset ${idx + 1}`} className="aspect-[16/10] w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                Deskripsi ruangan
              </span>
              <textarea
                rows={2}
                value={roomForm.description}
                onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat kondisi dan peruntukan ruang..."
                className="sh-control h-auto py-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5 border-t border-[#ECEFF4] pt-4 sm:flex sm:justify-end dark:border-ink-line">
              <button type="button" onClick={() => setShowRoomModal(false)} className="sh-btn-secondary">
                Batal
              </button>
              <button type="submit" disabled={savingRoom} className="sh-btn-primary">
                {savingRoom ? 'Menyimpan...' : roomForm.originalCode ? 'Simpan' : 'Tambah ruang'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
