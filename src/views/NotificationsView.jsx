import { AlertTriangle, Bell, CalendarCheck2, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  cancel: {
    icon: XCircle,
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  favorite: {
    icon: Star,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  },
  report: {
    icon: AlertTriangle,
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
  },
};

export default function NotificationsView() {
  const { notifications, clearNotifications } = useSpaceHub();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1d3d] dark:text-white">Notifikasi</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Riwayat aktivitas in-app.</p>
        </div>

        {notifications.length > 0 && (
          <button type="button" onClick={clearNotifications} className="sh-btn-secondary py-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="sh-card border-dashed px-6 py-12 text-center">
          <Bell className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-2 text-sm font-bold">Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = CATEGORY_META[n.category] || {
              icon: Bell,
              badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
            };
            const Icon = meta.icon;
            return (
              <article key={n.id} className="sh-card flex items-center gap-3 p-3.5">
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${meta.badge}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-extrabold">{n.title}</h3>
                    <span className="text-[10px] font-medium text-slate-400">{n.at}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
