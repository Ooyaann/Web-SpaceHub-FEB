import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function SelectPopover({
  label,
  value,
  onChange,
  options,
  icon: Icon = null,
  align = 'left',
  placeholder = 'Pilih...',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-[#5B667B] dark:text-[#9AA7BE]">{label}</span>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-unnes-navy bg-white dark:border-unnes-gold dark:bg-ink-subtle' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 flex-none text-[#7B869B] dark:text-[#8693AA]" />}
          <span className="truncate font-medium">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-[#7B869B] transition-transform duration-150 dark:text-[#8693AA] ${
            open ? 'rotate-180 text-unnes-navy dark:text-unnes-gold' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-lg border border-[#E2E6EE] bg-white p-1 shadow-popover dark:border-white/[0.1] dark:bg-ink-card dark:shadow-popover-dark ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-[13px] transition ${
                  active
                    ? 'bg-[#EEF2FA] font-semibold text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold'
                    : 'font-normal text-[#2D3648] hover:bg-[#F5F7FA] dark:text-[#DCE3F0] dark:hover:bg-ink-subtle/70'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="h-3.5 w-3.5 flex-none" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
