import { SLOT_LABELS } from '../lib/constants';

const SWATCH_CLASS = {
  f: 'bg-[#a7e3bd] dark:bg-[#1f6a43]',
  k: 'bg-[#1d4ed8] dark:bg-[#5b8cff]',
  o: 'bg-[#f08a24] dark:bg-[#ff9f45]',
  m: 'bg-[#ffc72c]',
  p: 'bg-[#dbe3f3] opacity-70 dark:bg-[#25335a]',
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-300 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-[4px] ${SWATCH_CLASS[k]}`} />
          <span>{SLOT_LABELS[k]}</span>
        </span>
      ))}
    </div>
  );
}
