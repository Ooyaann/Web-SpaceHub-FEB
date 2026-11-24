import { SLOT_LABELS } from '../lib/constants';

const SWATCH_CLASS = {
  f: 'bg-emerald-600 dark:bg-emerald-400',
  k: 'bg-[#1D4ED8] dark:bg-[#5B8EFF]',
  o: 'bg-amber-600 dark:bg-amber-400',
  m: 'bg-unnes-gold',
  p: 'bg-slate-300 dark:bg-[#2A395B]',
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[#526382] dark:text-unnes-night-muted ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
    >
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 font-medium">
          <span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${SWATCH_CLASS[k]}`} />
          <span>{SLOT_LABELS[k]}</span>
        </span>
      ))}
    </div>
  );
}
