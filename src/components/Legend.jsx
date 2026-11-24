import { SLOT_LABELS } from '../lib/constants';

const SWATCH_CLASS = {
  f: 'bg-[#22A06B]',
  k: 'bg-[#3B6DD8]',
  o: 'bg-[#D97706]',
  m: 'bg-unnes-gold',
  p: 'bg-[#CBD2DF] dark:bg-[#49556E]',
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[#5B667B] dark:text-[#9AA7BE] ${
        compact ? 'text-xs' : 'text-[13px]'
      }`}
    >
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${SWATCH_CLASS[k]}`} />
          <span>{SLOT_LABELS[k]}</span>
        </span>
      ))}
    </div>
  );
}
