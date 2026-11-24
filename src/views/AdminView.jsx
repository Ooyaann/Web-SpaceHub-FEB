import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Building2, CalendarCheck2, Filter, Search } from 'lucide-react';
import { OPERATIONAL_HOURS } from '../lib/constants';
import { formatDateKeyLabel, formatHour, formatHourRange } from '../lib/dateWib';
import { getRawSlotStatus, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';
import SelectPopover from '../components/SelectPopover';

export default function AdminView() {
  const { rooms, bookings, reports, days, nowWib, user } = useSpaceHub();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('bookings');

  const targetDay = days[selectedDayIdx] || days[0];

  const statusOptions = [
    { value: 'all', label: 'Semua status' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

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
        !(b.user_name || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">
            Dashboard pengelola
          </h1>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Keterisian ruang & riwayat pemakaian FEB UNNES.
          </p>
        </div>
        <div className="w-56">
          <DatePickerPopover
            label="Tanggal analitik"
            days={days}
            value={selectedDayIdx}
            onChange={(idx) => setSelectedDayIdx(idx)}
            align="right"
          />
        </div>
      </div>

      {/* KPI Metrics — clean hairline grid, zero box-in-box clutter */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="sh-panel p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
            <span>Total ruang</span>
            <Building2 className="h-4 w-4 text-[#7B869B]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
            {stats.totalRooms}
          </div>
        </div>

        <div className="sh-panel p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
            <span>Booking aktif</span>
            <CalendarCheck2 className="h-4 w-4 text-[#22A06B]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
            {stats.activeBookingsCount}
          </div>
        </div>

        <div className="sh-panel p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
            <span>Keterisian</span>
            <BarChart3 className="h-4 w-4 text-unnes-navy dark:text-unnes-gold" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
            {stats.occupancyPct}%
          </div>
        </div>

        <div className="sh-panel p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">
            <span>Laporan lapangan</span>
            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
            {stats.totalReports}
          </div>
        </div>
      </div>

      {/* Building Occupancy */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold text-[#141923] dark:text-[#EEF2F7]">Keterisian per gedung</h2>
          <span className="text-xs font-medium text-[#6B768C] dark:text-[#8E9BB3]">{targetDay.label}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.buildings.map((b) => (
            <div key={b.building} className="sh-panel p-4">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold text-[#141923] dark:text-[#EEF2F7]">
                  Gedung {b.building}{' '}
                  <span className="font-normal text-[#6B768C] dark:text-[#8E9BB3]">({b.roomCount} ruang)</span>
                </span>
                <span className="font-mono font-bold tabular-nums text-unnes-navy dark:text-unnes-gold">
                  {b.pct}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EAEEF5] dark:bg-ink-subtle">
                <div
                  className="h-full rounded-full bg-unnes-navy transition-all dark:bg-unnes-gold"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="mt-2.5 flex justify-between text-xs tabular-nums text-[#5B667B] dark:text-[#9AA7BE]">
                <span>Kuliah: {b.classSlots} slot</span>
                <span>Booking: {b.bookedSlots} slot</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bookings & Reports Table */}
      <section className="sh-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECEF] px-5 py-4 dark:border-white/[0.08]">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab('bookings')}
              className={`sh-chip ${tab === 'bookings' ? 'sh-chip-active' : ''}`}
            >
              Riwayat booking ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('reports')}
              className={`sh-chip ${tab === 'reports' ? 'sh-chip-active' : ''}`}
            >
              Laporan ({reports.length})
            </button>
          </div>

          {tab === 'bookings' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B869B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode / NIM / ruang..."
                  className="sh-control w-52 pl-9 text-xs"
                />
              </div>
              <div className="w-40">
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
        </div>

        {tab === 'bookings' ? (
          filteredBookings.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
              Belum ada data booking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="border-b border-[#EAECEF] bg-[#F8F9FB] text-xs font-semibold text-[#5B667B] dark:border-white/[0.08] dark:bg-ink-subtle dark:text-[#9AA7BE]">
                  <tr>
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-4 py-3">Ruang</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Keperluan</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECEF] dark:divide-white/[0.06]">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8F9FB] dark:hover:bg-ink-subtle/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold tabular-nums text-unnes-navy dark:text-unnes-gold">
                        {b.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#141923] dark:text-[#EEF2F7]">
                        {b.room_code}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#141923] dark:text-[#EEF2F7]">
                          {formatDateKeyLabel(b.booking_date, days)}
                        </span>
                        <span className="ml-1.5 font-mono text-xs tabular-nums text-[#6B768C] dark:text-[#8E9BB3]">
                          {formatHourRange(b.start_hour, b.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#141923] dark:text-[#EEF2F7]">{b.user_name}</span>
                        <span className="ml-1.5 font-mono text-xs tabular-nums text-[#6B768C] dark:text-[#8E9BB3]">
                          {b.nim}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-[#434E63] dark:text-[#B8C3D9]">
                        {b.purpose}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#434E63] dark:text-[#C4CFE2]">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              b.status === 'confirmed' ? 'bg-[#22A06B]' : 'bg-[#E11D48]'
                            }`}
                          />
                          {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">Belum ada laporan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-[13px]">
              <thead className="border-b border-[#EAECEF] bg-[#F8F9FB] text-xs font-semibold text-[#5B667B] dark:border-white/[0.08] dark:bg-ink-subtle dark:text-[#9AA7BE]">
                <tr>
                  <th className="px-5 py-3">Ruang</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-5 py-3">Pelapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECEF] dark:divide-white/[0.06]">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FB] dark:hover:bg-ink-subtle/60">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#141923] dark:text-[#EEF2F7]">
                      {r.room_code}
                    </td>
                    <td className="px-4 py-3 text-[#141923] dark:text-[#EEF2F7]">
                      {formatDateKeyLabel(r.report_date, days)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-[#141923] dark:text-[#EEF2F7]">
                      {formatHour(r.report_hour)} WIB
                    </td>
                    <td className="px-5 py-3 text-[#5B667B] dark:text-[#9AA7BE]">{r.reported_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
