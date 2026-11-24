import { AlertTriangle, Bell, CalendarCheck2, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    label: 'Booking',
  },
  cancel: {
    icon: XCircle,
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    label: 'Pembatalan',
  },
  favorite: {
    icon: Star,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    label: 'Favorit',
  },
  report: {
    icon: AlertTriangle,
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    label: 'Laporan',
  },
};

export default function NotificationsView() {
  const { notifications, clearNotifications } = useSpaceHub();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">
            Riwayat Notifikasi (In-App)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Catatan aktivitas booking, pembatalan, favorit, dan pelaporan ruang langsung di dalam web SpaceHub.
          </p>
        </div>

        {notifications.length > 0 && (
          <button type="button" onClick={clearNotifications} className="sh-btn-secondary py-2 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan Riwayat
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-[#0f1d3d] dark:text-white">Belum ada notifikasi aktivitas.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Notifikasi akan muncul otomatis saat kamu memesan ruang, membatalkan booking, menyimpan favorit, atau melapor.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const meta = CATEGORY_META[n.category] || {
              icon: Bell,
              badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
              label: 'Info',
            };
            const Icon = meta.icon;
            return (
              <article key={n.id} className="sh-card flex items-start gap-3.5 p-4">
                <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl ${meta.badge}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#0f1d3d] dark:text-white">{n.title}</h3>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{n.at}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{n.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
