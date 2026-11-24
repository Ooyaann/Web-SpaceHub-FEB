const WIB_TIMEZONE = 'Asia/Jakarta';

const ID_WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatHour(h) {
  return `${pad2(h)}.00`;
}

export function formatHourRange(startHour, duration) {
  return `${formatHour(startHour)} – ${formatHour(startHour + duration)}`;
}

export function getNowWib() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour);
  const minute = Number(map.minute);

  return {
    year,
    month,
    day,
    hour,
    minute,
    dateKey: `${map.year}-${map.month}-${map.day}`,
    timeLabel: `${pad2(hour)}:${pad2(minute)} WIB`,
  };
}

export function clampStartHour(hour) {
  return Math.min(15, Math.max(7, hour));
}

export function getNext31DaysWib() {
  const { year, month, day } = getNowWib();
  // Gunakan UTC noon agar tidak pernah meleset tanggal akibat offset lokal browser
  const baseUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return Array.from({ length: 31 }, (_, i) => {
    const d = new Date(baseUtc.getTime() + i * 86400000);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const dt = d.getUTCDate();
    const weekday = d.getUTCDay(); // 0=Min .. 6=Sab
    const key = `${y}-${pad2(m)}-${pad2(dt)}`;
    const shortDate = `${dt} ${ID_MONTHS[m - 1]}`;
    const prefix = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : ID_WEEKDAYS[weekday];
    return {
      index: i,
      key,
      weekday,
      dayNum: dt,
      shortDate,
      label: `${prefix}, ${shortDate}`,
    };
  });
}

export function formatDateKeyLabel(dateKey, daysList) {
  const found = daysList?.find((d) => d.key === dateKey);
  if (found) return found.label;
  if (!dateKey) return '-';
  const [y, m, dt] = dateKey.split('-').map(Number);
  if (!y || !m || !dt) return dateKey;
  return `${dt} ${ID_MONTHS[m - 1]} ${y}`;
}

export function formatRupiah(amount) {
  const num = Number(amount) || 0;
  if (num <= 0) return 'Gratis (Mahasiswa FEB)';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function formatPriceBadge(amount) {
  const num = Number(amount) || 0;
  if (num <= 0) return 'Gratis Mahasiswa FEB';
  return `Rp ${num.toLocaleString('id-ID')}/jam`;
}
