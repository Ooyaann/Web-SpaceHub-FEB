import { AlertTriangle, Bell, CheckCircle2, X, XCircle } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

const VARIANT_META = {
  success: {
    icon: CheckCircle2,
    badge: 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#14532D] dark:text-[#4ADE80]',
    ring: 'border-[#BBF7D0] dark:border-[#22C55E]/35',
  },
  error: {
    icon: XCircle,
    badge: 'bg-rose-100 text-rose-600 dark:bg-[#3B1D26] dark:text-rose-400',
    ring: 'border-rose-200 dark:border-rose-500/35',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'bg-[#FFEDD5] text-[#D97706] dark:bg-[#422B14] dark:text-[#FBBF24]',
    ring: 'border-[#FED7AA] dark:border-[#FB923C]/40',
  },
  info: {
    icon: Bell,
    badge: 'bg-[#EEF3FC] text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold',
    ring: 'border-[#D5E0F6] dark:border-ink-line-strong',
  },
};

/**
 * Heads-Up Pop-up Notification (gaya notifikasi layar atas iOS / Android):
 * Muncul meluncur halus dari bagian atas layar HP maupun pojok kanan atas Desktop.
 */
export default function Toast() {
  const { toast, dismissToast, navigate } = useSpaceHub();
  if (!toast) return null;

  const meta = VARIANT_META[toast.type] || VARIANT_META.info;
  const Icon = meta.icon;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="pt-safe pointer-events-none fixed inset-x-3 top-3 z-[60] flex justify-center sm:inset-x-auto sm:right-5 sm:top-5 sm:justify-end"
    >
      <div
        className={`animate-toast-in pointer-events-auto flex w-full max-w-[392px] items-start gap-3 rounded-2xl border bg-white/98 p-3.5 shadow-[0_16px_38px_-8px_rgba(15,23,42,0.22),0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-md dark:bg-ink-card/98 dark:shadow-[0_18px_42px_-8px_rgba(0,0,0,0.68)] ${meta.ring}`}
      >
        <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl ${meta.badge}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wide text-unnes-navy dark:text-unnes-gold">
              SpaceHub · Baru saja
            </span>
          </div>

          <p className="mt-0.5 text-[13px] font-bold leading-snug text-[#101828] dark:text-[#F5F7FA]">
            {toast.title || toast.message}
          </p>

          {toast.title && toast.message && (
            <p className="mt-0.5 text-xs leading-relaxed text-[#475467] dark:text-[#B0B8C9]">{toast.message}</p>
          )}

          {toast.actionView && (
            <button
              type="button"
              onClick={() => {
                navigate(toast.actionView);
                dismissToast();
              }}
              className="mt-2 inline-flex items-center rounded-lg bg-unnes-navy px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-unnes-navy-hover active:scale-95 dark:bg-unnes-gold dark:text-unnes-gold-ink"
            >
              {toast.actionLabel || 'Lihat detail'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          aria-label="Tutup notifikasi"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F2F4F8] dark:text-[#8A93A6] dark:hover:bg-ink-subtle"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
