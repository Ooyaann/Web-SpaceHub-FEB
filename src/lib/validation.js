export const UNNES_EMAIL_REGEX = /^[^@\s]+@(student\.|mail\.)?unnes\.ac\.id$/i;
export const NIM_REGEX = /^\d{8,12}$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidUnnesEmail(email) {
  return UNNES_EMAIL_REGEX.test(normalizeEmail(email));
}

export function isValidNim(nim) {
  return NIM_REGEX.test(String(nim || '').trim());
}

export function deriveNameFromEmail(email) {
  const local = normalizeEmail(email).split('@')[0] || 'Pengguna';
  const cleaned = local.replace(/[^a-zA-Z]+/g, ' ').trim();
  if (!cleaned) return 'Pengguna';
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SH-${suffix}`;
}
