import { AlertTriangle, Bell, CalendarCheck2, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    iconColor: 'text-[#10B981]',
  },
  cancel: {
    icon: XCircle,
    iconColor: 'text-rose-500',
  },
  favorite: {
    icon: Star,
    iconColor: 'text-unnes-gold',
  },
  report: {
    icon: AlertTriangle,
    iconColor: 'text-[#F59E0B]',
  },
};

export default function NotificationsView() {
  const { notifications, clearNotifications } = useSpaceHub();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#101828] dark:text-[#F5F7FA]">Notifikasi</h1>
          <p className="mt-1 text-[13px] text-[#475467] dark:text-[#B0B8C9]">Riwayat aktivitas booking dan laporan.</p>
        </div>

        {notifications.length > 0 && (
          <button type="button" onClick={clearNotifications} className="sh-btn-secondary h-9 px-3 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="sh-panel py-16 text-center">
          <Bell className="mx-auto h-7 w-7 text-[#98A2B3]" />
          <p className="mt-3 text-[15px] font-bold text-[#101828] dark:text-[#F5F7FA]">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="sh-panel divide-y divide-[#ECEFF4] overflow-hidden dark:divide-ink-line">
          {notifications.map((n) => {
            const meta = CATEGORY_META[n.category] || {
              icon: Bell,
              iconColor: 'text-unnes-navy dark:text-unnes-gold',
            };
            const Icon = meta.icon;
            return (
              <article key={n.id} className="flex items-start gap-3.5 p-4">
                <div
                  className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#E4E7EE] bg-[#F6F8FB] dark:border-ink-line dark:bg-ink-subtle ${meta.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[13px] font-bold text-[#101828] dark:text-[#F5F7FA]">{n.title}</h2>
                    <span className="font-mono text-xs tabular-nums text-[#667085] dark:text-[#8A93A6]">{n.at}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[#475467] dark:text-[#B0B8C9]">{n.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
