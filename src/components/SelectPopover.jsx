import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * SelectPopover — Dropdown kustom modern yang seragam dengan DatePickerPopover
 * (tinggi h-10, radius rounded-xl, ikon Lucide, checkmark aktif, support Light & Dark Mode).
 */
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
        <span className="mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-brand ring-2 ring-brand/15 dark:border-brand-dark dark:ring-brand-dark/20' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 flex-none text-slate-400" />}
          <span className="truncate font-semibold">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-brand dark:text-brand-dark' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-xl border border-line-light bg-white p-1.5 shadow-popover dark:border-line-dark dark:bg-[#131c2e] ${
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
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? 'bg-brand/10 font-bold text-brand dark:bg-brand-dark/20 dark:text-blue-300'
                    : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80'
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
