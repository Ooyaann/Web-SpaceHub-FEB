import { CheckCircle2, Clock, GraduationCap, Plus, Users } from 'lucide-react';
import { SLOT_LABELS } from '../lib/constants';

const META = {
  f: {
    icon: Plus,
    chip: 'border-[#86EFAC] bg-[#DCFCE7] text-[#166534] dark:border-[#22C55E]/45 dark:bg-[#14532D] dark:text-[#ECFDF5]',
  },
  k: {
    icon: GraduationCap,
    chip: 'border-[#93C5FD] bg-[#DBEAFE] text-[#1E40AF] dark:border-[#60A5FA]/40 dark:bg-[#1E3A8A]/80 dark:text-[#DBEAFE]',
  },
  o: {
    icon: Users,
    chip: 'border-[#FDBA74] bg-[#FFEDD5] text-[#9A3412] dark:border-[#FB923C]/45 dark:bg-[#7C2D12]/85 dark:text-[#FFEDD5]',
  },
  m: {
    icon: CheckCircle2,
    chip: 'border-[#D99B00] bg-unnes-gold text-unnes-gold-ink',
  },
  p: {
    icon: Clock,
    chip: 'border-[#DCE2EC] bg-[#F1F3F7] text-[#667085] dark:border-ink-line dark:bg-[#1A1D25] dark:text-[#8A93A6]',
  },
};

export default function Legend({ keys = ['f', 'k', 'o', 'm', 'p'], compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-[#475467] dark:text-[#B0B8C9] ${
        compact ? 'text-xs' : 'text-[13px]'
      }`}
    >
      {keys.map((k) => {
        const { icon: Icon, chip } = META[k];
        return (
          <span key={k} className="inline-flex items-center gap-1.5 font-medium">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${chip}`}>
              <Icon className="h-3 w-3 stroke-[2.25]" />
            </span>
            <span>{SLOT_LABELS[k]}</span>
          </span>
        );
      })}
    </div>
  );
}
