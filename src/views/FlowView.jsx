import { ArrowRight } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const STEPS = [
  {
    title: 'Masuk atau Daftar dengan Email UNNES',
    desc: 'Gunakan email domain @student.unnes.ac.id, @mail.unnes.ac.id, atau @unnes.ac.id agar booking & favorit tersinkron lintas perangkat.',
  },
  {
    title: 'Filter Waktu, Gedung, Kapasitas, & Fasilitas',
    desc: 'Atur tanggal (hingga 30 hari ke depan), jam mulai (07.00–15.00), durasi (1–3 jam), gedung L2/L4/L5, serta fasilitas seperti AC, Proyektor, Whiteboard, WiFi, atau Colokan.',
  },
  {
    title: 'Periksa Detail Ruang, Tarif, & Jadwal Per Jam',
    desc: 'Lihat foto ruangan, kapasitas, daftar fasilitas lengkap, informasi tarif ruangan, timeline ketersediaan 07.00–17.00 WIB, dan rekomendasi ruang alternatif kosong.',
  },
  {
    title: 'Isi Form Booking & Pengecekan Bentrok Otomatis',
    desc: 'Masukkan NIM (8–12 digit), keperluan, dan jumlah peserta. Server Supabase otomatis memeriksa bentrok agar tidak terjadi double-booking lintas HP/laptop.',
  },
  {
    title: 'Pantau, Batalkan, atau Laporkan Kondisi Lapangan',
    desc: 'Lihat kode booking (SH-XXXXX) di menu Booking Saya, batalkan sebelum jam mulai jika rencana berubah, atau klik Lapor Terpakai jika ruang sedang digunakan di lapangan.',
  },
  {
    title: 'Ringkasan Keterisian di Halaman Pengelola',
    desc: 'Pengelola dapat membuka dashboard ringkas (PIN demo: feb2026) untuk melihat persentase keterisian tiap gedung serta riwayat pemakaian ruangan.',
  },
];

export default function FlowView() {
  const { navigate } = useSpaceHub();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Alur Penggunaan SpaceHub</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Panduan ringkas dari login hingga pengelolaan booking ruang kelas FEB UNNES.
        </p>
      </div>

      <div className="sh-card divide-y divide-unnes-border overflow-hidden dark:divide-unnes-border-dark">
        {STEPS.map((step, idx) => (
          <div key={step.title} className="flex items-start gap-4 p-4 sm:p-5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-unnes-navy text-sm font-extrabold text-unnes-gold">
              {idx + 1}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0f1d3d] dark:text-white">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => navigate('find')} className="sh-btn-primary">
          Mulai Cari Ruang Kosong
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
