import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { pad2 } from '../lib/dateWib';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function DatePickerPopover({ days, value, onChange, label, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDay = days[value] || days[0];
  const dayIndexByKey = useMemo(() => new Map(days.map((d) => [d.key, d.index])), [days]);

  const [viewYear, viewMonth] = useMemo(() => {
    const [y, m] = selectedDay.key.split('-').map(Number);
    return [y, m - 1];
  }, [selectedDay.key]);

  const [cursor, setCursor] = useState({ year: viewYear, month: viewMonth });

  useEffect(() => {
    setCursor({ year: viewYear, month: viewMonth });
  }, [viewYear, viewMonth, open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
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

  const minMonthKey = days[0].key.slice(0, 7);
  const maxMonthKey = days[days.length - 1].key.slice(0, 7);
  const currentMonthKey = `${cursor.year}-${pad2(cursor.month + 1)}`;

  const canPrev = currentMonthKey > minMonthKey;
  const canNext = currentMonthKey < maxMonthKey;

  const shiftMonth = (delta) => {
    const d = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setCursor({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  const cells = useMemo(() => {
    const firstUtc = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const offset = (firstUtc.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const arr = [];
    for (let i = 0; i < offset; i += 1) arr.push(null);
    for (let dt = 1; dt <= daysInMonth; dt += 1) {
      const key = `${cursor.year}-${pad2(cursor.month + 1)}-${pad2(dt)}`;
      const idx = dayIndexByKey.has(key) ? dayIndexByKey.get(key) : null;
      arr.push({ dt, key, idx });
    }
    return arr;
  }, [cursor, dayIndexByKey]);

  const handleSelect = (idx) => {
    onChange(idx);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">{label}</span>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-unnes-navy ring-2 ring-unnes-navy/10 dark:border-unnes-gold dark:ring-unnes-gold/15' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <CalendarDays className="h-4 w-4 flex-none text-[#667085] dark:text-[#8F98AD]" />
          <span className="truncate font-medium">{selectedDay.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-[#667085] transition-transform duration-150 dark:text-[#8F98AD] ${
            open ? 'rotate-180 text-unnes-navy dark:text-unnes-gold' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`animate-popover-in absolute z-50 mt-1.5 w-[296px] rounded-2xl border border-[#E2E6EE] bg-white p-3.5 shadow-popover dark:border-ink-line-strong dark:bg-ink-card dark:shadow-popover-dark ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-3 flex gap-1.5">
            {[
              { idx: 0, text: 'Hari ini' },
              { idx: 1, text: 'Besok' },
              { idx: 2, text: 'Lusa' },
            ].map((s) => (
              <button
                key={s.idx}
                type="button"
                onClick={() => handleSelect(s.idx)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  value === s.idx
                    ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                    : 'bg-[#F2F4F8] text-[#475467] hover:bg-[#E7EBF2] dark:bg-ink-subtle dark:text-[#D0D7E6] dark:hover:bg-ink-hover'
                }`}
              >
                {s.text}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="rounded-lg p-1.5 text-[#475467] transition hover:bg-[#F2F4F8] disabled:opacity-30 dark:text-[#B0B8C9] dark:hover:bg-ink-subtle"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-[13px] font-bold text-[#101828] dark:text-[#F5F7FA]">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </div>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="rounded-lg p-1.5 text-[#475467] transition hover:bg-[#F2F4F8] disabled:opacity-30 dark:text-[#B0B8C9] dark:hover:bg-ink-subtle"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#7F889B]">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`blank-${i}`} />;
              const disabled = cell.idx === null;
              const isSelected = cell.idx === value;
              const isToday = cell.idx === 0;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(cell.idx)}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-all ${
                    isSelected
                      ? 'bg-unnes-navy font-bold text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : disabled
                        ? 'cursor-not-allowed text-[#CBD2DF] dark:text-[#444C5E]'
                        : 'text-[#1E2636] hover:bg-[#F2F4F8] dark:text-[#E2E7F1] dark:hover:bg-ink-subtle'
                  }`}
                >
                  {cell.dt}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-unnes-gold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
