export const MAX_ADVANCE_DAYS = 30;
export const MAX_DURATION = 3;
export const MAX_ACTIVE_BOOKINGS = 3;
export const ADMIN_PIN = 'feb2026';

export const OPERATIONAL_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
export const START_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15];

export const FACILITY_OPTIONS = ['AC', 'Proyektor', 'Whiteboard', 'WiFi', 'Colokan'];

export const SLOT_LABELS = {
  f: 'Kosong',
  k: 'Ada kelas',
  o: 'Terpakai',
  m: 'Bookingmu',
  p: 'Lewat',
};

export const BOOKING_RULE_PILLS = [
  'Maks. H+30',
  'Durasi 1–3 jam',
  'Maks. 3 aktif',
  'Batal < jam mulai',
];

const ROOM_LAYOUT = {
  L2: {
    3: ['301', '302', '303', '304', '305', '306', '311', '312'],
  },
  L4: {
    2: ['201', '202', '203', '204', '211', '212', '214', '215'],
    3: ['302', '303', '304'],
    4: ['402', '403', '410', '413', '414'],
    5: ['503', '504', '511', '512', '513', '514', 'Lab 5A', 'Lab 5B'],
    6: ['601', '602', '603', '604', '611', '612', 'Lab 6B'],
    7: ['701', '702', '703', '704', '711', '712', '713', '714', '715', '716'],
  },
  L5: {
    1: ['101', '102', '103', '107', '108'],
    2: ['201', '202', '203', '207', '208'],
    3: ['301', '302', '303', '307', '308'],
  },
};

const FACILITY_PRESETS = [
  ['AC', 'Proyektor', 'WiFi', 'Colokan'],
  ['AC', 'WiFi'],
  ['AC', 'Proyektor', 'Colokan'],
  ['AC', 'Proyektor', 'Whiteboard'],
  ['Whiteboard', 'WiFi'],
  ['AC', 'Whiteboard', 'WiFi', 'Colokan'],
];

const ROOM_IMAGES = [
  '/images/feb-hero.jpg',
  '/images/room-1.jpg',
  '/images/room-2.jpg',
  '/images/login-bg.jpg',
];

export const FALLBACK_ROOMS = (() => {
  const list = [];
  let idx = 0;
  for (const [building, floors] of Object.entries(ROOM_LAYOUT)) {
    for (const [floorStr, numbers] of Object.entries(floors)) {
      const floor = Number(floorStr);
      numbers.forEach((num, i) => {
        const isLab = num.startsWith('Lab');
        const capacity = isLab ? 30 : [40, 45, 36, 50, 60][(floor + i) % 5];
        const facilities = isLab
          ? ['AC', 'Proyektor', 'WiFi', 'Colokan']
          : FACILITY_PRESETS[(floor + i) % FACILITY_PRESETS.length];
        const pricePerHour = isLab ? 50000 : 0;
        const priceNote = isLab
          ? 'Praktikum kuliah gratis · Non-akademik Rp 50.000/jam'
          : capacity >= 60
            ? 'Mahasiswa FEB gratis · Umum Rp 75.000/jam'
            : 'Mahasiswa FEB gratis · Umum Rp 50.000/jam';
        const description = isLab
          ? `Lab praktikum ${capacity} kursi · Gedung ${building} Lt. ${floor}.`
          : `Ruang kuliah ${capacity} kursi · Gedung ${building} Lt. ${floor}.`;

        list.push({
          id: `fallback-${idx + 1}`,
          code: `${building} ${num}`,
          building,
          floor,
          location_label: `Gedung ${building} · Lantai ${floor}`,
          capacity,
          facilities,
          price_per_hour: pricePerHour,
          price_note: priceNote,
          description,
          image_url: ROOM_IMAGES[idx % ROOM_IMAGES.length],
        });
        idx += 1;
      });
    }
  }
  return list;
})();

export function getFloorOptions(rooms) {
  const seen = new Map();
  for (const r of rooms) {
    const key = `${r.building}-${r.floor}`;
    if (!seen.has(key)) {
      seen.set(key, r.location_label || `Gedung ${r.building} · Lantai ${r.floor}`);
    }
  }
  return Array.from(seen.entries());
}
