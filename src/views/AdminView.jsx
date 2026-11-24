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
    { value: 'all', label: 'Semua Status' },
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Dashboard Pengelola
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">
            Ringkasan tingkat keterisian & riwayat pemakaian ruang FEB UNNES.
          </p>
        </div>
        <div className="w-56">
          <DatePickerPopover
            label="Tanggal Analitik"
            days={days}
            value={selectedDayIdx}
            onChange={(idx) => setSelectedDayIdx(idx)}
            align="right"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#526382] dark:text-unnes-night-muted">
            <span>Total Ruang</span>
            <Building2 className="h-4 w-4 text-[#6A7B9C]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{stats.totalRooms}</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#526382] dark:text-unnes-night-muted">
            <span>Booking Aktif</span>
            <CalendarCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{stats.activeBookingsCount}</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#526382] dark:text-unnes-night-muted">
            <span>Keterisian</span>
            <BarChart3 className="h-4 w-4 text-unnes-royal dark:text-unnes-gold" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{stats.occupancyPct}%</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-[#526382] dark:text-unnes-night-muted">
            <span>Laporan Lapangan</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{stats.totalReports}</div>
        </div>
      </div>

      <section className="sh-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold">Keterisian per Gedung</h2>
          <span className="font-mono text-xs font-medium text-[#6A7B9C] dark:text-unnes-night-muted">
            {targetDay.label}
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {stats.buildings.map((b) => (
            <div key={b.building} className="rounded-lg bg-surface-subtle/70 p-4 dark:bg-unnes-night-input">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">
                  Gedung {b.building}{' '}
                  <span className="font-mono font-normal text-[#6A7B9C]">({b.roomCount})</span>
                </span>
                <span className="font-mono font-bold text-unnes-royal dark:text-unnes-gold">{b.pct}%</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#DCE3F0] dark:bg-[#1B2B4B]">
                <div
                  className="h-full rounded-full bg-unnes-royal transition-all dark:bg-unnes-gold"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-[#526382] dark:text-unnes-night-muted">
                <span>Kuliah: {b.classSlots}</span>
                <span>Booking: {b.bookedSlots}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sh-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-light p-4 dark:border-unnes-night-line">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab('bookings')}
              className={`sh-chip ${tab === 'bookings' ? 'sh-chip-active' : ''}`}
            >
              Riwayat Booking ({bookings.length})
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
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A7B9C]" />
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
            <div className="p-10 text-center text-xs text-[#526382] dark:text-unnes-night-muted">
              Belum ada data booking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-surface-subtle/80 text-[10px] uppercase tracking-wider text-[#526382] dark:bg-unnes-night-input dark:text-unnes-night-muted">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Ruang</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Keperluan</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light dark:divide-unnes-night-line">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-subtle/40 dark:hover:bg-[#15223D]/70">
                      <td className="px-4 py-3 font-mono font-bold text-unnes-royal dark:text-unnes-gold">{b.id}</td>
                      <td className="px-4 py-3 font-mono font-bold">{b.room_code}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{formatDateKeyLabel(b.booking_date, days)}</span>
                        <span className="ml-1.5 font-mono text-[11px] text-[#6A7B9C]">
                          {formatHourRange(b.start_hour, b.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{b.user_name}</span>
                        <span className="ml-1.5 font-mono text-[11px] text-[#6A7B9C]">{b.nim}</span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-[#3C4E70] dark:text-[#C5D2EA]">
                        {b.purpose}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#526382] dark:text-unnes-night-muted">Belum ada laporan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead className="bg-surface-subtle/80 text-[10px] uppercase tracking-wider text-[#526382] dark:bg-unnes-night-input dark:text-unnes-night-muted">
                <tr>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-4 py-3">Pelapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light dark:divide-unnes-night-line">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-bold">{r.room_code}</td>
                    <td className="px-4 py-3">{formatDateKeyLabel(r.report_date, days)}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{formatHour(r.report_hour)} WIB</td>
                    <td className="px-4 py-3 text-[#526382] dark:text-unnes-night-muted">{r.reported_by}</td>
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
