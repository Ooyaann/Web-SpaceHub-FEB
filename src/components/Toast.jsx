import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';

export default function Toast() {
  const { toast } = useSpaceHub();
  if (!toast) return null;

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-popover dark:border-slate-700 dark:bg-slate-800"
    >
      <Icon
        className={`h-4 w-4 flex-none ${
          toast.type === 'success'
            ? 'text-emerald-400'
            : toast.type === 'error'
              ? 'text-rose-400'
              : 'text-blue-400'
        }`}
      />
      <span>{toast.message}</span>
    </div>
  );
}
