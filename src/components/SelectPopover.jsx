import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

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

  const renderOptionList = (mobile = false) =>
    options.map((opt) => {
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
          className={`flex w-full items-center justify-between gap-3 rounded-xl text-left transition-colors ${
            mobile ? 'px-3.5 py-3 text-sm' : 'px-2.5 py-2 text-[13px]'
          } ${
            active
              ? 'bg-[#EEF3FC] font-semibold text-unnes-navy dark:bg-ink-subtle dark:text-unnes-gold'
              : 'font-medium text-[#344054] hover:bg-[#F4F6FA] dark:text-[#E2E7F1] dark:hover:bg-ink-subtle/70'
          }`}
        >
          <span className="truncate">{opt.label}</span>
          {active && <Check className="h-4 w-4 flex-none" />}
        </button>
      );
    });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">{label}</span>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`sh-control flex items-center justify-between gap-2 text-left text-[13px] ${
          open ? 'border-unnes-navy ring-2 ring-unnes-navy/10 dark:border-unnes-gold dark:ring-unnes-gold/15' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 flex-none text-[#667085] dark:text-[#8F98AD]" />}
          <span className="truncate font-medium">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-[#667085] transition-transform duration-150 dark:text-[#8F98AD] ${
            open ? 'rotate-180 text-unnes-navy dark:text-unnes-gold' : ''
          }`}
        />
      </button>

      {open && (
        <>
          {/* Mobile Bottom Sheet (< sm) — bebas kepotong layar HP */}
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-[1px] sm:hidden"
            onClick={() => setOpen(false)}
          >
            <div
              role="listbox"
              onClick={(e) => e.stopPropagation()}
              className="animate-sheet-in flex max-h-[72vh] w-full flex-col rounded-2xl border border-[#E2E6EE] bg-white p-3 shadow-popover dark:border-ink-line-strong dark:bg-ink-card"
            >
              <div className="mb-2 flex items-center justify-between border-b border-[#ECEFF4] px-1 pb-2.5 dark:border-ink-line">
                <span className="text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">
                  {label || placeholder}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-[#667085] dark:text-[#B0B8C9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-0.5 overflow-y-auto">{renderOptionList(true)}</div>
            </div>
          </div>

          {/* Desktop/Tablet Anchored Popover (sm+) */}
          <div
            role="listbox"
            className={`animate-popover-in absolute z-50 mt-1.5 hidden max-h-64 min-w-full overflow-y-auto rounded-xl border border-[#E2E6EE] bg-white p-1.5 shadow-popover sm:block dark:border-ink-line-strong dark:bg-ink-card dark:shadow-popover-dark ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {renderOptionList(false)}
          </div>
        </>
      )}
    </div>
  );
}
