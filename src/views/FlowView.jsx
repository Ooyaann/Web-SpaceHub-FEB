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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">Alur sistem</h1>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
            Enam langkah singkat penggunaan SpaceHub FEB UNNES.
          </p>
        </div>
        <button type="button" onClick={() => navigate('find')} className="sh-btn-primary h-9 px-3.5 text-xs">
          Cari ruang
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, desc }, idx) => (
          <li key={title} className="sh-panel flex items-start gap-3.5 p-5">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EEF3FC] text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-xs font-semibold tabular-nums text-[#667085] dark:text-[#8A93A6]">
                0{idx + 1}
              </span>
              <h2 className="mt-0.5 text-[14px] font-bold text-[#101828] dark:text-[#F5F7FA]">{title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#475467] dark:text-[#B0B8C9]">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
