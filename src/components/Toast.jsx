import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function Toast() {
  const { toast } = useSpaceHub();
  if (!toast) return null;

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="animate-toast-in fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#101828] px-4 py-3 text-[13px] font-medium text-white shadow-popover dark:border dark:border-ink-line-strong dark:bg-ink-subtle"
    >
      <Icon
        className={`h-4 w-4 flex-none ${
          toast.type === 'success'
            ? 'text-[#10B981]'
            : toast.type === 'error'
              ? 'text-rose-400'
              : 'text-unnes-gold'
        }`}
      />
      <span>{toast.message}</span>
    </div>
  );
}
