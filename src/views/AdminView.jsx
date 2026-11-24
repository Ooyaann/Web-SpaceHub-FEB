import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarCheck2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { ADMIN_PIN, OPERATIONAL_HOURS } from '../lib/constants';
import { formatDateKeyLabel, formatHour, formatHourRange } from '../lib/dateWib';
import { getRawSlotStatus, isBookingActive } from '../lib/schedule';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function AdminView() {
  const { rooms, bookings, reports, days, nowWib, user, adminUnlocked, unlockAdmin } = useSpaceHub();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
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
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [bookings, statusFilter]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');
    if (!unlockAdmin(pinInput)) {
      setPinError('PIN Pengelola salah. Coba masukkan PIN demo yang tertera.');
    }
  };

  if (!adminUnlocked) {
    return (
      <div className="mx-auto max-w-md py-8">
        <form onSubmit={handlePinSubmit} className="sh-card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-unnes-navy text-unnes-gold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1d3d] dark:text-white">
                Halaman Pengelola (Ringkas)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masukkan PIN pengelola untuk melihat riwayat pemakaian & keterisian ruang.
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">PIN Pengelola</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN..."
                className="sh-input pl-9"
              />
            </div>
          </label>

          {pinError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {pinError}
            </div>
          )}

          <button type="submit" className="sh-btn-primary w-full">
            Buka Dashboard Pengelola
          </button>

          <p className="rounded-lg bg-unnes-surface px-3 py-2 text-center text-[11px] text-slate-500 dark:bg-[#0d1730] dark:text-slate-400">
            Info demo presentasi — PIN default: <strong className="font-mono text-unnes-navy dark:text-unnes-gold">{ADMIN_PIN}</strong>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">
            Dashboard Pengelola (Ringkas)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ringkasan tingkat keterisian ruangan dan riwayat pemakaian FEB UNNES.
          </p>
        </div>

        <label className="block min-w-[200px]">
          <span className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Tanggal Analitik Keterisian
          </span>
          <select
            value={selectedDayIdx}
            onChange={(e) => setSelectedDayIdx(Number(e.target.value))}
            className="sh-input"
          >
            {days.map((d) => (
              <option key={d.key} value={d.index}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Ruangan</span>
            <Building2 className="h-4 w-4 text-unnes-blue dark:text-unnes-blue-light" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0f1d3d] dark:text-white tabular-nums">
            {stats.totalRooms}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Gedung L2, L4, L5</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Booking Aktif</span>
            <CalendarCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0f1d3d] dark:text-white tabular-nums">
            {stats.activeBookingsCount}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Tersimpan di server</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tingkat Keterisian</span>
            <BarChart3 className="h-4 w-4 text-unnes-blue dark:text-unnes-blue-light" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0f1d3d] dark:text-white tabular-nums">
            {stats.occupancyPct}%
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{targetDay.label}</div>
        </div>

        <div className="sh-card p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Laporan Terpakai</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0f1d3d] dark:text-white tabular-nums">
            {stats.totalReports}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Laporan lapangan</div>
        </div>
      </div>

      {/* Tingkat Keterisian per Gedung */}
      <section className="sh-card p-5">
        <h3 className="text-sm font-extrabold text-[#0f1d3d] dark:text-white">
          Tingkat Keterisian per Gedung — {targetDay.label}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Gabungan slot kuliah contoh + booking mahasiswa + laporan terpakai (dari total 10 jam/ruang per hari).
        </p>

        <div className="mt-4 space-y-3.5">
          {stats.buildings.map((b) => (
            <div key={b.building}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-[#0f1d3d] dark:text-white">
                  Gedung {b.building}{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-400">({b.roomCount} ruang)</span>
                </span>
                <span className="font-extrabold tabular-nums text-unnes-blue dark:text-unnes-gold">
                  {b.pct}% ({b.occupiedSlots}/{b.totalSlots} slot)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-unnes-surface dark:bg-[#0d1730]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-unnes-navy to-unnes-blue transition-all dark:from-unnes-blue dark:to-unnes-gold"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="mt-1 flex gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Kuliah (contoh): {b.classSlots} slot</span>
                <span>Booking & laporan: {b.bookedSlots} slot</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Riwayat Pemakaian & Laporan */}
      <section className="sh-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-unnes-border p-4 dark:border-unnes-border-dark">
          <div className="flex gap-2">
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
              Laporan Lapangan ({reports.length})
            </button>
          </div>

          {tab === 'bookings' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sh-input w-auto py-1.5 text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="confirmed">Disetujui (Confirmed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          )}
        </div>

        {tab === 'bookings' ? (
          filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Belum ada riwayat booking ruangan untuk filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="bg-unnes-surface text-[11px] uppercase tracking-wider text-slate-500 dark:bg-[#0d1730] dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Ruang</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Keperluan</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-unnes-border dark:divide-unnes-border-dark">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-unnes-surface/50 dark:hover:bg-[#162347]">
                      <td className="px-4 py-3 font-mono font-bold text-unnes-blue dark:text-unnes-blue-light">
                        {b.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0f1d3d] dark:text-white">{b.room_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{formatDateKeyLabel(b.booking_date, days)}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatHourRange(b.start_hour, b.duration)} ({b.participants} org)
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{b.user_name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">NIM {b.nim}</div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                        {b.purpose}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                          }`}
                        >
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
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Belum ada laporan ruang terpakai dari pengguna.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="bg-unnes-surface text-[11px] uppercase tracking-wider text-slate-500 dark:bg-[#0d1730] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ruang</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jam Dilaporkan</th>
                  <th className="px-4 py-3">Pelapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-unnes-border dark:divide-unnes-border-dark">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-bold text-[#0f1d3d] dark:text-white">{r.room_code}</td>
                    <td className="px-4 py-3">{formatDateKeyLabel(r.report_date, days)}</td>
                    <td className="px-4 py-3 font-semibold">{formatHour(r.report_hour)} WIB</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.reported_by}</td>
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
