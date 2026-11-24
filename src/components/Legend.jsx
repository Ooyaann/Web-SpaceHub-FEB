import { SLOT_LABELS } from '../lib/constants';

const SWATCH_CLASS = {
  f: 'bg-[#10B981]',
  k: 'bg-[#64748B] dark:bg-[#7E879B]',
  o: 'bg-[#F59E0B]',
  m: 'bg-unnes-gold',
  p: 'bg-[#CBD2DF] dark:bg-[#424A5C]',
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[#475467] dark:text-[#B0B8C9] ${
        compact ? 'text-xs' : 'text-[13px]'
      }`}
    >
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 font-medium">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${SWATCH_CLASS[k]}`} />
          <span>{SLOT_LABELS[k]}</span>
        </span>
      ))}
    </div>
  );
}
