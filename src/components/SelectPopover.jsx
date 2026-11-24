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
        <span className="mb-1.5 block text-[11px] font-semibold text-[#526382] dark:text-unnes-night-muted">
          {label}
        </span>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-unnes-royal ring-2 ring-unnes-royal/15 dark:border-unnes-gold dark:ring-unnes-gold/20' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 flex-none text-[#6A7B9C] dark:text-[#6E82AA]" />}
          <span className="truncate font-semibold">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-[#6A7B9C] transition-transform duration-150 dark:text-[#6E82AA] ${
            open ? 'rotate-180 text-unnes-royal dark:text-unnes-gold' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-lg border border-line-light bg-white p-1 shadow-popover dark:border-unnes-night-line dark:bg-[#13203A] ${
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
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? 'bg-unnes-royal/10 font-bold text-unnes-royal dark:bg-unnes-gold/15 dark:text-unnes-gold'
                    : 'font-medium text-[#243452] hover:bg-surface-subtle dark:text-[#D9E3F5] dark:hover:bg-[#1B2B4B]'
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
