import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarCheck2,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ADMIN_PIN, OPERATIONAL_HOURS } from '../lib/constants';
import { formatDateKeyLabel, formatHour, formatHourRange } from '../lib/dateWib';
import { getRawSlotStatus, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';
import DatePickerPopover from '../components/DatePickerPopover';

export default function AdminView() {
  const { rooms, bookings, reports, days, nowWib, user, adminUnlocked, unlockAdmin } = useSpaceHub();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('bookings');

  const targetDay = days[selectedDayIdx] || days[0];

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

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');
    if (!unlockAdmin(pinInput)) {
      setPinError('PIN salah.');
    }
  };

  if (!adminUnlocked) {
    return (
      <div className="mx-auto max-w-sm py-10">
        <form onSubmit={handlePinSubmit} className="sh-card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-unnes-navy text-unnes-gold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0f1d3d] dark:text-white">Akses Pengelola</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">PIN demo: {ADMIN_PIN}</p>
            </div>
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN pengelola"
              className="sh-input pl-9"
            />
          </div>

          {pinError && (
            <div role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {pinError}
            </div>
          )}

          <button type="submit" className="sh-btn-primary w-full">
            Masuk Pengelola
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Dashboard Pengelola</h2>
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

      {/* 4 KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Ruang</span>
            <Building2 className="h-4 w-4 text-unnes-blue dark:text-unnes-blue-light" />
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums">{stats.totalRooms}</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Booking Aktif</span>
            <CalendarCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums">{stats.activeBookingsCount}</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Keterisian</span>
            <BarChart3 className="h-4 w-4 text-unnes-blue dark:text-unnes-blue-light" />
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums">{stats.occupancyPct}%</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Laporan</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums">{stats.totalReports}</div>
        </div>
      </div>

      {/* Keterisian per Gedung */}
      <section className="sh-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold">Keterisian per Gedung</h3>
          <span className="text-xs font-semibold text-slate-400">{targetDay.label}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {stats.buildings.map((b) => (
            <div key={b.building} className="rounded-xl bg-unnes-surface p-3.5 dark:bg-[#0d1730]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold">
                  Gedung {b.building}{' '}
                  <span className="font-medium text-slate-500">({b.roomCount})</span>
                </span>
                <span className="font-extrabold tabular-nums text-unnes-blue dark:text-unnes-gold">
                  {b.pct}%
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white dark:bg-[#1a274c]">
                <div
                  className="h-full rounded-full bg-unnes-navy transition-all dark:bg-unnes-gold"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Kuliah: {b.classSlots}</span>
                <span>Booking/Lapor: {b.bookedSlots}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabel Riwayat */}
      <section className="sh-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-unnes-border p-4 dark:border-unnes-border-dark">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab('bookings')}
              className={`sh-chip ${tab === 'bookings' ? 'sh-chip-active' : ''}`}
            >
              Booking ({bookings.length})
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode / NIM / ruang..."
                  className="sh-input w-48 py-1.5 pl-8 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sh-input w-auto py-1.5 text-xs"
              >
                <option value="all">Semua</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {tab === 'bookings' ? (
          filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Belum ada data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-unnes-surface text-[10px] uppercase tracking-wider text-slate-500 dark:bg-[#0d1730] dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Kode</th>
                    <th className="px-4 py-2.5">Ruang</th>
                    <th className="px-4 py-2.5">Jadwal</th>
                    <th className="px-4 py-2.5">Peminjam</th>
                    <th className="px-4 py-2.5">Keperluan</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-unnes-border dark:divide-unnes-border-dark">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-unnes-surface/50 dark:hover:bg-[#162347]">
                      <td className="px-4 py-2.5 font-mono font-bold text-unnes-blue dark:text-unnes-gold">{b.id}</td>
                      <td className="px-4 py-2.5 font-bold">{b.room_code}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold">{formatDateKeyLabel(b.booking_date, days)}</span>
                        <span className="ml-1.5 text-[11px] text-slate-500">
                          {formatHourRange(b.start_hour, b.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold">{b.user_name}</span>
                        <span className="ml-1.5 text-[11px] text-slate-400">{b.nim}</span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2.5 text-slate-600 dark:text-slate-300">
                        {b.purpose}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
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
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Belum ada laporan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead className="bg-unnes-surface text-[10px] uppercase tracking-wider text-slate-500 dark:bg-[#0d1730] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Ruang</th>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Jam</th>
                  <th className="px-4 py-2.5">Pelapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-unnes-border dark:divide-unnes-border-dark">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-bold">{r.room_code}</td>
                    <td className="px-4 py-2.5">{formatDateKeyLabel(r.report_date, days)}</td>
                    <td className="px-4 py-2.5 font-semibold">{formatHour(r.report_hour)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.reported_by}</td>
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
