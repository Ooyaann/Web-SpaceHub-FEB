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
        <span className="mb-1.5 block text-[11px] font-semibold text-[#526382] dark:text-unnes-night-muted">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-unnes-royal ring-2 ring-unnes-royal/15 dark:border-unnes-gold dark:ring-unnes-gold/20' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <CalendarDays className="h-4 w-4 flex-none text-[#6A7B9C] dark:text-[#6E82AA]" />
          <span className="truncate font-semibold">{selectedDay.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-[#6A7B9C] transition-transform duration-150 dark:text-[#6E82AA] ${
            open ? 'rotate-180 text-unnes-royal dark:text-unnes-gold' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-[292px] rounded-xl border border-line-light bg-white p-3.5 shadow-popover dark:border-unnes-night-line dark:bg-[#13203A] ${
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
                className={`flex-1 rounded-md py-1.5 text-[11px] font-bold transition ${
                  value === s.idx
                    ? 'bg-unnes-royal text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                    : 'bg-surface-subtle text-[#334463] hover:bg-[#E1E7F2] dark:bg-[#1B2B4B] dark:text-[#CBD7EE] dark:hover:bg-[#24375E]'
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
              className="rounded-md p-1.5 text-[#526382] transition hover:bg-surface-subtle disabled:opacity-30 dark:text-unnes-night-muted dark:hover:bg-[#1B2B4B]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-bold text-[#0F1B33] dark:text-[#F1F5FB]">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </div>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="rounded-md p-1.5 text-[#526382] transition hover:bg-surface-subtle disabled:opacity-30 dark:text-unnes-night-muted dark:hover:bg-[#1B2B4B]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[#7B8BA9]">
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
                  className={`relative flex h-9 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition ${
                    isSelected
                      ? 'bg-unnes-royal font-bold text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                      : disabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-[#2A395B]'
                        : 'text-[#1B2B4B] hover:bg-surface-subtle dark:text-[#D9E3F5] dark:hover:bg-[#1B2B4B]'
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
