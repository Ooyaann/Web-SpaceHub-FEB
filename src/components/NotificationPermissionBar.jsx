import { useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { isSystemNotificationSupported } from '../lib/systemNotification';

const DISMISS_KEY = 'spacehub_notif_bar_dismissed_v1';

export default function NotificationPermissionBar() {
  const { notifPermission, enableSystemNotifications } = useSpaceHub();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isSystemNotificationSupported() || notifPermission !== 'default' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="border-b border-[#E4E7EE] bg-[#EEF3FC]/85 px-3.5 py-2.5 sm:px-6 dark:border-ink-line dark:bg-ink-card/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink">
            <BellRing className="h-4 w-4" />
          </div>
          <p className="min-w-0 text-xs leading-snug text-[#1E2636] dark:text-[#E5E9F2]">
            <span className="font-bold">Aktifkan notifikasi bar atas HP?</span>{' '}
            <span className="text-[#475467] dark:text-[#B0B8C9]">
              Agar tiket booking &amp; info pengelola muncul di panel notifikasi HP.
            </span>
          </p>
        </div>

        <div className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            onClick={enableSystemNotifications}
            className="inline-flex h-8 items-center rounded-lg bg-unnes-navy px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-unnes-navy-hover active:scale-95 dark:bg-unnes-gold dark:text-unnes-gold-ink"
          >
            Izinkan
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup tawaran notifikasi"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] transition hover:bg-white/70 dark:text-[#8A93A6] dark:hover:bg-ink-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
