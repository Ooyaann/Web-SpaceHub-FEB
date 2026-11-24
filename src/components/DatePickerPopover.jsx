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
        <span className="mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`sh-control flex items-center justify-between gap-2 text-left ${
          open ? 'border-brand ring-2 ring-brand/15 dark:border-brand-dark dark:ring-brand-dark/20' : ''
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <CalendarDays className="h-4 w-4 flex-none text-slate-400" />
          <span className="truncate font-semibold">{selectedDay.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-none text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-brand dark:text-brand-dark' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-[292px] rounded-2xl border border-line-light bg-white p-3.5 shadow-popover dark:border-line-dark dark:bg-[#131c2e] ${
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
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                  value === s.idx
                    ? 'bg-brand text-white dark:bg-brand-dark'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </div>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-slate-400">
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
                  className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition ${
                    isSelected
                      ? 'bg-brand font-bold text-white shadow-sm dark:bg-brand-dark'
                      : disabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cell.dt}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand dark:bg-brand-dark" />
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
