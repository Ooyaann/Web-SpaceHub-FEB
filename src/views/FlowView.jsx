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
  { icon: ShieldCheck, title: 'Portal Pengelola', desc: 'Masuk lewat tab Pengelola di halaman login' },
];

export default function FlowView() {
  const { navigate } = useSpaceHub();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Alur Sistem
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">6 langkah penggunaan SpaceHub.</p>
        </div>
        <button type="button" onClick={() => navigate('find')} className="sh-btn-primary h-9 px-3.5 text-xs">
          Cari Ruang
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, desc }, idx) => (
          <div key={title} className="sh-card flex items-start gap-3.5 p-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-unnes-navy text-unnes-gold dark:bg-unnes-gold/15 dark:text-unnes-gold">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6A7B9C] dark:text-unnes-night-muted">
                0{idx + 1}
              </div>
              <h2 className="mt-0.5 text-sm font-bold text-[#0F1B33] dark:text-[#F1F5FB]">{title}</h2>
              <p className="mt-0.5 text-xs text-[#526382] dark:text-unnes-night-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
