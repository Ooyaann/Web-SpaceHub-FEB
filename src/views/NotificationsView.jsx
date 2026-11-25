import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Download,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import {
  isSystemNotificationSupported,
  promptInstallPwa,
  subscribeInstallPrompt,
} from '../lib/systemNotification';

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
  const {
    notifications,
    clearNotifications,
    notifPermission,
    enableSystemNotifications,
    testSystemNotification,
    showToast,
  } = useSpaceHub();
  const supportsNotif = isSystemNotificationSupported();
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => subscribeInstallPrompt(setCanInstallPwa), []);

  const handleInstallPwa = async () => {
    const installed = await promptInstallPwa();
    if (installed) {
      showToast({
        title: 'Aplikasi SpaceHub Dipasang!',
        message: 'SpaceHub telah ditambahkan ke layar utama HP kamu.',
        type: 'success',
      });
    }
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.025em] text-[#101828] sm:text-2xl dark:text-[#F5F7FA]">
            Notifikasi
          </h1>
          <p className="mt-0.5 text-xs text-[#475467] sm:mt-1 sm:text-[13px] dark:text-[#B0B8C9]">
            Notifikasi panel atas HP, konfirmasi tiket booking, dan pembaruan jadwal pengelola.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={testSystemNotification} className="sh-btn-primary h-9 px-3.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Tes Notifikasi HP
          </button>

          {canInstallPwa && (
            <button type="button" onClick={handleInstallPwa} className="sh-btn-secondary h-9 px-3 text-xs">
              <Download className="h-3.5 w-3.5" />
              Install Aplikasi
            </button>
          )}

          {notifications.length > 0 && (
            <button type="button" onClick={clearNotifications} className="sh-btn-secondary h-9 px-3 text-xs">
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan
            </button>
          )}
        </div>
      </div>

      {/* Kartu Status Notifikasi Sistem HP (Android / Desktop / iOS PWA) */}
      {supportsNotif && notifPermission === 'default' && (
        <div className="sh-panel flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EEF3FC] text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#101828] sm:text-[13px] dark:text-[#F5F7FA]">
                Munculkan notifikasi di panel atas layar HP kamu
              </div>
              <div className="mt-0.5 text-xs text-[#667085] dark:text-[#B0B8C9]">
                Klik <strong>Aktifkan</strong> agar tiket booking &amp; info dari Pengelola masuk ke bar notifikasi sistem HP seperti aplikasi.
              </div>
            </div>
          </div>

          <button type="button" onClick={enableSystemNotifications} className="sh-btn-primary h-9 px-4 text-xs">
            Aktifkan
          </button>
        </div>
      )}

      {supportsNotif && notifPermission === 'granted' && (
        <div className="sh-panel flex flex-wrap items-center justify-between gap-3 border-[#BBF7D0] bg-[#F0FDF4]/70 p-3.5 dark:border-[#22C55E]/30 dark:bg-[#14532D]/20">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 flex-none text-[#16A34A] dark:text-[#4ADE80]" />
            <span className="text-xs font-semibold text-[#15803D] dark:text-[#86EFAC]">
              Notifikasi sistem HP aktif — pemberitahuan booking akan muncul langsung di panel atas HP kamu.
            </span>
          </div>
        </div>
      )}

      {supportsNotif && notifPermission === 'denied' && (
        <div className="sh-panel flex items-start gap-3 border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400" />
          <div className="text-xs leading-relaxed text-[#475467] dark:text-[#D0D5DD]">
            <span className="font-bold text-[#101828] dark:text-white">Izin notifikasi masih diblokir browser.</span>{' '}
            Ketuk ikon pengaturan di sebelah kiri alamat URL Chrome, pilih <strong>Izin / Permissions</strong>, lalu aktifkan <strong>Notifikasi</strong>.
          </div>
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
