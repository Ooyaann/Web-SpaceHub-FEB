import { AlertTriangle, Bell, CalendarCheck2, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  cancel: {
    icon: XCircle,
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  favorite: {
    icon: Star,
    badge: 'bg-amber-50 text-amber-700 dark:bg-unnes-gold/15 dark:text-unnes-gold',
  },
  report: {
    icon: AlertTriangle,
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
};

export default function NotificationsView() {
  const { notifications, clearNotifications } = useSpaceHub();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#0F1B33] dark:text-[#F1F5FB]">
            Notifikasi
          </h1>
          <p className="mt-1 text-xs text-[#526382] dark:text-unnes-night-muted">Riwayat aktivitas in-app.</p>
        </div>

        {notifications.length > 0 && (
          <button type="button" onClick={clearNotifications} className="sh-btn-secondary h-9 px-3 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="sh-card border-dashed px-6 py-14 text-center">
          <Bell className="mx-auto h-7 w-7 text-[#6A7B9C]" />
          <p className="mt-2 text-sm font-bold text-[#0F1B33] dark:text-[#F1F5FB]">Belum ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const meta = CATEGORY_META[n.category] || {
              icon: Bell,
              badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
            };
            const Icon = meta.icon;
            return (
              <article key={n.id} className="sh-card flex items-center gap-3.5 p-4">
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${meta.badge}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-bold text-[#0F1B33] dark:text-[#F1F5FB]">{n.title}</h2>
                    <span className="font-mono text-[11px] font-medium text-[#6A7B9C] dark:text-unnes-night-muted">
                      {n.at}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#526382] dark:text-unnes-night-muted">{n.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
