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
  { icon: LogIn, title: 'Login email UNNES', desc: 'Masuk dengan akun @student / @mail / @unnes.ac.id.' },
  { icon: Search, title: 'Pilih tanggal & slot', desc: 'Tentukan hari, jam mulai, durasi, gedung, dan fasilitas.' },
  { icon: Tag, title: 'Cek detail & tarif', desc: 'Lihat foto ruang, fasilitas, estimasi tarif, dan alternatif kosong.' },
  { icon: CalendarCheck2, title: 'Booking anti-bentrok', desc: 'Konfirmasi pemakaian yang tersimpan real-time di Supabase.' },
  { icon: ClipboardList, title: 'Kelola booking', desc: 'Salin kode SH-XXXXX atau batalkan sebelum jam mulai.' },
  { icon: ShieldCheck, title: 'Portal pengelola', desc: 'Pengelola masuk melalui tab Pengelola di halaman login.' },
];

export default function FlowView() {
  const { navigate } = useSpaceHub();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">Alur sistem</h1>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">
            Enam langkah singkat penggunaan SpaceHub FEB UNNES.
          </p>
        </div>
        <button type="button" onClick={() => navigate('find')} className="sh-btn-primary h-9 px-3.5 text-xs">
          Cari ruang
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, desc }, idx) => (
          <li
            key={title}
            className="flex items-start gap-3.5 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]"
          >
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#F1F3F7] text-unnes-navy dark:bg-ink-card dark:text-unnes-gold">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-xs font-semibold tabular-nums text-[#7B869B] dark:text-[#8693AA]">
                0{idx + 1}
              </span>
              <h2 className="mt-0.5 text-[14px] font-bold text-[#141923] dark:text-[#EEF2F7]">{title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5B667B] dark:text-[#9AA7BE]">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
