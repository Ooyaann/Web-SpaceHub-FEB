import { SLOT_LABELS } from '../lib/constants';

const SWATCH_CLASS = {
  f: 'bg-emerald-500/80 dark:bg-emerald-400/75',
  k: 'bg-blue-500/80 dark:bg-blue-400/75',
  o: 'bg-amber-500/80 dark:bg-amber-400/75',
  m: 'bg-brand-gold',
  p: 'bg-slate-300 dark:bg-slate-700',
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500 dark:text-slate-400 ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
    >
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 font-medium">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${SWATCH_CLASS[k]}`} />
          <span>{SLOT_LABELS[k]}</span>
        </span>
      ))}
    </div>
  );
}
