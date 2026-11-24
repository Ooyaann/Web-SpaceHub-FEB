import {
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  LogIn,
  Search,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const STEPS = [
  { icon: LogIn, title: 'Login Email UNNES', desc: '@student / @mail / @unnes.ac.id' },
  { icon: Search, title: 'Pilih Tanggal & Slot', desc: 'Kalender popup, jam, durasi, & fasilitas' },
  { icon: Tag, title: 'Cek Detail & Tarif', desc: 'Foto, fasilitas, tarif, & alternatif kosong' },
  { icon: CalendarCheck2, title: 'Booking Anti-Bentrok', desc: 'Tersimpan real-time di Supabase' },
  { icon: ClipboardList, title: 'Kelola Booking', desc: 'Salin kode SH-XXXXX atau batalkan' },
  { icon: ShieldCheck, title: 'Pantau Pengelola', desc: 'Keterisian gedung & riwayat (PIN feb2026)' },
];

export default function FlowView() {
  const { navigate } = useSpaceHub();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Panduan Singkat</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">6 langkah penggunaan SpaceHub.</p>
        </div>
        <button type="button" onClick={() => navigate('find')} className="sh-btn-primary py-2 text-xs">
          Cari Ruang
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, desc }, idx) => (
          <div key={title} className="sh-card flex items-start gap-3.5 p-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-unnes-navy text-unnes-gold">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-unnes-blue dark:text-unnes-gold">
                Langkah {idx + 1}
              </div>
              <h3 className="mt-0.5 text-sm font-extrabold">{title}</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
