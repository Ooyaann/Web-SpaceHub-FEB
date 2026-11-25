import { useState } from 'react';
import { AlertTriangle, Bell, BellRing, CalendarCheck2, Sparkles, Star, Trash2, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const CATEGORY_META = {
  booking: {
    icon: CalendarCheck2,
    iconColor: 'text-[#16A34A] dark:text-[#4ADE80]',
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
  const { notifications, clearNotifications, showToast } = useSpaceHub();
  const supportsBrowserNotif = typeof window !== 'undefined' && 'Notification' in window;
  const [perm, setPerm] = useState(() => (supportsBrowserNotif ? Notification.permission : 'unsupported'));

  const handleRequestPerm = async () => {
    if (!supportsBrowserNotif) return;
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === 'granted') {
        showToast({
          title: 'Notifikasi Browser Aktif!',
          message: 'Pemberitahuan booking & pembaruan jadwal akan muncul di layar perangkatmu.',
          type: 'success',
        });
      }
    } catch {
      // ignore
    }
  };

  const handleTestPopup = () => {
    showToast({
      title: 'Contoh Pop-up Notifikasi SpaceHub',
      message: 'Ruang L2 301 · Besok, 09.00–11.00 WIB telah dikonfirmasi (Kode SH-9K4M2).',
      type: 'success',
      actionLabel: 'Lihat Tiket',
      actionView: 'mine',
    });
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
            Notifikasi
          </h1>
          <p className="mt-0.5 text-xs text-[#475467] sm:mt-1 sm:text-[13px] dark:text-[#B0B8C9]">
            Pop-up pemberitahuan booking, pembatalan pengelola, dan laporan ruang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleTestPopup} className="sh-btn-secondary h-9 px-3 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-unnes-navy dark:text-unnes-gold" />
            Tes pop-up
          </button>

          {notifications.length > 0 && (
            <button type="button" onClick={clearNotifications} className="sh-btn-secondary h-9 px-3 text-xs">
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan
            </button>
          )}
        </div>
      </div>

      {/* Browser System Notification Opt-In Banner */}
      {supportsBrowserNotif && perm === 'default' && (
        <div className="sh-panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EEF3FC] text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#101828] sm:text-[13px] dark:text-[#F5F7FA]">
                Izinkan notifikasi sistem browser di perangkat ini?
              </div>
              <div className="text-xs text-[#667085] dark:text-[#B0B8C9]">
                Agar pemberitahuan tetap tampil di bar atas browser saat kamu booking atau ada info dari pengelola.
              </div>
            </div>
          </div>

          <button type="button" onClick={handleRequestPerm} className="sh-btn-primary h-9 px-3.5 text-xs">
            Aktifkan
          </button>
        </div>
      )}

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
                    <span className="font-mono text-[11px] tabular-nums text-[#667085] dark:text-[#8A93A6]">{n.at}</span>
                  </div>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-[#475467] sm:text-[13px] dark:text-[#B0B8C9]">
                    {n.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
