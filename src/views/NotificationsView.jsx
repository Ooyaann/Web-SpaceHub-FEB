import { AlertTriangle, Bell, CalendarCheck2, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    tint: 'bg-[#E9F7F0] text-[#1D7A52] dark:bg-[#1E3A30] dark:text-[#7CE0B2]',
  },
  cancel: {
    icon: XCircle,
    tint: 'bg-[#FDECEC] text-[#B91C1C] dark:bg-[#3A2229] dark:text-[#FCA5A5]',
  },
  favorite: {
    icon: Star,
    tint: 'bg-[#FEF6DF] text-[#9A6B06] dark:bg-[#3A301A] dark:text-unnes-gold',
  },
  report: {
    icon: AlertTriangle,
    tint: 'bg-[#FEF3E6] text-[#B45309] dark:bg-[#3B2A1E] dark:text-[#FDBA74]',
  },
};

export default function NotificationsView() {
  const { notifications, clearNotifications } = useSpaceHub();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECEF] pb-6 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#141923] dark:text-[#EEF2F7]">Notifikasi</h1>
          <p className="mt-1 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">Riwayat aktivitas booking dan laporan.</p>
        </div>

        {notifications.length > 0 && (
          <button type="button" onClick={clearNotifications} className="sh-btn-secondary h-9 px-3 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto h-7 w-7 text-[#8A94A6]" />
          <p className="mt-3 text-[15px] font-semibold text-[#141923] dark:text-[#EEF2F7]">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="divide-y divide-[#EAECEF] border-b border-[#EAECEF] dark:divide-white/[0.08] dark:border-white/[0.08]">
          {notifications.map((n) => {
            const meta = CATEGORY_META[n.category] || {
              icon: Bell,
              tint: 'bg-[#EEF2F9] text-unnes-navy dark:bg-ink-subtle dark:text-[#B8C7E2]',
            };
            const Icon = meta.icon;
            return (
              <article key={n.id} className="flex items-start gap-3.5 py-4">
                <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg ${meta.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[13px] font-semibold text-[#141923] dark:text-[#EEF2F7]">{n.title}</h2>
                    <span className="font-mono text-xs tabular-nums text-[#7B869B] dark:text-[#8693AA]">{n.at}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[#5B667B] dark:text-[#9AA7BE]">{n.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
