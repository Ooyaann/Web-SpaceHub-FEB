import { formatHourRange, getNext31DaysWib, getNowWib, getOffsetDayWib } from './dateWib.js';
import { isDemoClassHour } from './schedule.js';

/**
 * Mencari jam kosong bebas jadwal kuliah pada ruangan/kandidat ruangan tertentu
 * agar data demo awal 100% bebas bentrok dengan jadwal kuliah deterministik.
 */
function pickClassFreeSlot(candidateCodes, dayObj, preferredHours, duration, usedSlots) {
  for (const code of candidateCodes) {
    for (const h of preferredHours) {
      if (h + duration > 17) continue;
      let ok = true;
      for (let cur = h; cur < h + duration; cur += 1) {
        const slotKey = `${code}|${dayObj.key}|${cur}`;
        if (usedSlots.has(slotKey) || isDemoClassHour(code, dayObj.key, dayObj.weekday, cur)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let cur = h; cur < h + duration; cur += 1) {
          usedSlots.add(`${code}|${dayObj.key}|${cur}`);
        }
        return { roomCode: code, startHour: h, duration };
      }
    }
  }
  return null;
}

/**
 * Menghasilkan dataset demo realistis FEB UNNES (Bookings, Reports, Favorites, Notifications)
 * sehingga saat dibuka pertama kali semua status (Kosong, Ada Kelas, Terpakai, Bookingmu),
 * Booking Saya, Favorit, Notifikasi, dan Dashboard Pengelola langsung hidup dan informatif.
 */
export function buildInitialDemoDataset() {
  const now = getNowWib();
  const days = getNext31DaysWib();
  const today = days[0];
  const tomorrow = days[1];
  const lusa = days[2];
  const yesterday = getOffsetDayWib(-1);

  const isAfterHours = now.hour >= 15;
  const activePrimaryDay = isAfterHours ? tomorrow : today;
  const activeSecondaryDay = isAfterHours ? lusa : tomorrow;
  const minTodayHour = isAfterHours ? 8 : Math.max(8, now.hour + 1);

  const preferredActiveToday = [minTodayHour, 13, 14, 10, 9, 8, 15, 7].filter(
    (h, idx, arr) => h >= 7 && h <= 15 && arr.indexOf(h) === idx
  );
  const preferredStandard = [9, 10, 13, 8, 11, 14, 7, 15];

  const usedSlots = new Set();
  const bookings = [];
  const reports = [];

  // 1. Dua Booking Aktif milik mahasiswa@student.unnes.ac.id (sisa 1/3 kuota agar tetap bisa tes booking baru!)
  const mySlot1 = pickClassFreeSlot(
    ['L2 301', 'L2 302', 'L2 304', 'L2 311'],
    activePrimaryDay,
    isAfterHours ? preferredStandard : preferredActiveToday,
    2,
    usedSlots
  );
  if (mySlot1) {
    bookings.push({
      id: 'SH-9K4M2',
      room_code: mySlot1.roomCode,
      booking_date: activePrimaryDay.key,
      start_hour: mySlot1.startHour,
      duration: mySlot1.duration,
      user_email: 'mahasiswa@student.unnes.ac.id',
      user_name: 'Mahasiswa FEB',
      nim: '7101422001',
      purpose: 'Diskusi Kelompok Akuntansi Keuangan',
      participants: 14,
      status: 'confirmed',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    });
  }

  const mySlot2 = pickClassFreeSlot(
    ['L4 512', 'L4 201', 'L4 204', 'L4 504'],
    activeSecondaryDay,
    [13, 10, 9, 14, 8],
    2,
    usedSlots
  );
  if (mySlot2) {
    bookings.push({
      id: 'SH-7P2N8',
      room_code: mySlot2.roomCode,
      booking_date: activeSecondaryDay.key,
      start_hour: mySlot2.startHour,
      duration: mySlot2.duration,
      user_email: 'mahasiswa@student.unnes.ac.id',
      user_name: 'Mahasiswa FEB',
      nim: '7101422001',
      purpose: 'Latihan Presentasi Studi Kasus Manajemen',
      participants: 18,
      status: 'confirmed',
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    });
  }

  // 2. Satu Riwayat Selesai (Kemarin) & Satu Dibatalkan milik mahasiswa@student.unnes.ac.id
  bookings.push({
    id: 'SH-3V8R1',
    room_code: 'L4 201',
    booking_date: yesterday.key,
    start_hour: 10,
    duration: 2,
    user_email: 'mahasiswa@student.unnes.ac.id',
    user_name: 'Mahasiswa FEB',
    nim: '7101422001',
    purpose: 'Review Proposal PKM Riset Sosial',
    participants: 8,
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
  });

  bookings.push({
    id: 'SH-5T1W6',
    room_code: 'L5 103',
    booking_date: tomorrow.key,
    start_hour: 13,
    duration: 2,
    user_email: 'mahasiswa@student.unnes.ac.id',
    user_name: 'Mahasiswa FEB',
    nim: '7101422001',
    purpose: 'Rapat Panitia Seminar Kewirausahaan',
    participants: 24,
    status: 'cancelled',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  });

  // 3. Booking Mahasiswa / Himpunan Lain & Blokir Pengelola (Status 'Terpakai' di L2, L4, L5 pada Hari Ini & Besok)
  const otherSpecs = [
    {
      id: 'SH-4H8L3',
      candidates: ['L2 303', 'L2 305', 'L2 306', 'L2 312'],
      day: today,
      hours: [9, 10, 13, 8, 14],
      dur: 2,
      email: 'hima.akt@student.unnes.ac.id',
      name: 'HIMA Akuntansi',
      nim: '7211422018',
      purpose: 'Rapat Divisi Keilmuan HIMA',
      ppl: 22,
    },
    {
      id: 'SH-6D2Q9',
      candidates: ['L2 305', 'L2 306', 'L2 311', 'L2 312'],
      day: today,
      hours: [13, 14, 11, 8],
      dur: 2,
      email: 'bem.feb@student.unnes.ac.id',
      name: 'BEM FEB UNNES',
      nim: '7101421044',
      purpose: 'Evaluasi Program Kerja BEM',
      ppl: 28,
    },
    {
      id: 'SH-2M9C4',
      candidates: ['L4 203', 'L4 204', 'L4 212', 'L4 215'],
      day: today,
      hours: [9, 10, 13, 8],
      dur: 2,
      email: 'ksep.feb@student.unnes.ac.id',
      name: 'KSEP FEB',
      nim: '7311422031',
      purpose: 'Diskusi Ekonomi Pembangunan',
      ppl: 30,
    },
    {
      id: 'SH-8B5X7',
      candidates: ['L4 214', 'L4 215', 'L4 302', 'L4 402'],
      day: today,
      hours: [13, 11, 9, 14],
      dur: 2,
      email: 'pengelola@unnes.ac.id',
      name: 'Pengelola FEB',
      nim: '19880412',
      purpose: 'Ujian Susulan Pengantar Bisnis',
      ppl: 35,
    },
    {
      id: 'SH-1Z6F5',
      candidates: ['L4 Lab 5A', 'L4 Lab 5B', 'L4 Lab 6B'],
      day: today,
      hours: [10, 13, 8, 14],
      dur: 2,
      email: 'asisten.lab@student.unnes.ac.id',
      name: 'Tim Asisten Lab',
      nim: '7211421009',
      purpose: 'Workshop Olah Data SPSS',
      ppl: 25,
    },
    {
      id: 'SH-9R7K2',
      candidates: ['L5 102', 'L5 101', 'L5 107', 'L5 201'],
      day: today,
      hours: [9, 11, 13, 8],
      dur: 2,
      email: 'hmj.ep@student.unnes.ac.id',
      name: 'HMJ Ekonomi',
      nim: '7311422055',
      purpose: 'Bedah Jurnal Makroekonomi',
      ppl: 20,
    },
    {
      id: 'SH-5W3J8',
      candidates: ['L2 304', 'L2 306', 'L2 312'],
      day: tomorrow,
      hours: [10, 13, 8, 14],
      dur: 2,
      email: 'hmj.manajemen@student.unnes.ac.id',
      name: 'HMJ Manajemen',
      nim: '7311422089',
      purpose: 'Simulasi Business Plan',
      ppl: 24,
    },
    {
      id: 'SH-3N4Y6',
      candidates: ['L4 203', 'L4 211', 'L4 303'],
      day: tomorrow,
      hours: [9, 13, 10],
      dur: 2,
      email: 'pengelola@unnes.ac.id',
      name: 'Pengelola FEB',
      nim: '19880412',
      purpose: 'Rapat Koordinasi Dosen Wali',
      ppl: 32,
    },
  ];

  otherSpecs.forEach((spec, i) => {
    const slot = pickClassFreeSlot(spec.candidates, spec.day, spec.hours, spec.dur, usedSlots);
    if (slot) {
      bookings.push({
        id: spec.id,
        room_code: slot.roomCode,
        booking_date: spec.day.key,
        start_hour: slot.startHour,
        duration: slot.duration,
        user_email: spec.email,
        user_name: spec.name,
        nim: spec.nim,
        purpose: spec.purpose,
        participants: spec.ppl,
        status: 'confirmed',
        created_at: new Date(Date.now() - 3600 * 1000 * (i + 2)).toISOString(),
      });
    }
  });

  // 4. Laporan Lapangan (room_reports)
  const reportSpecs = [
    {
      id: 'rep-seed-1',
      candidates: ['L2 311', 'L2 312', 'L2 302'],
      day: today,
      hours: [11, 14, 10, 15],
      by: 'alya.putri@student.unnes.ac.id',
    },
    {
      id: 'rep-seed-2',
      candidates: ['L4 211', 'L4 212', 'L4 202'],
      day: today,
      hours: [11, 14, 15, 10],
      by: 'rizky.pratama@student.unnes.ac.id',
    },
    {
      id: 'rep-seed-3',
      candidates: ['L5 108', 'L5 207', 'L5 301'],
      day: tomorrow,
      hours: [10, 13, 14],
      by: 'nadia.safitri@student.unnes.ac.id',
    },
  ];

  reportSpecs.forEach((rspec, i) => {
    const slot = pickClassFreeSlot(rspec.candidates, rspec.day, rspec.hours, 1, usedSlots);
    if (slot) {
      reports.push({
        id: rspec.id,
        room_code: slot.roomCode,
        report_date: rspec.day.key,
        report_hour: slot.startHour,
        reported_by: rspec.by,
        created_at: new Date(Date.now() - 1800 * 1000 * (i + 1)).toISOString(),
      });
    }
  });

  // 5. Favorit & Notifikasi Awal untuk mahasiswa@student.unnes.ac.id
  const favoritesMap = {
    'mahasiswa@student.unnes.ac.id': ['L2 301', 'L4 203', 'L4 512', 'L4 Lab 5A'],
  };

  const notifications = [
    mySlot1 && {
      id: 'nt-seed-1',
      title: 'Booking Disetujui',
      body: `${mySlot1.roomCode} · ${activePrimaryDay.label}, ${formatHourRange(mySlot1.startHour, mySlot1.duration)} · Kode SH-9K4M2`,
      category: 'booking',
      at: `${today.key} · 08:15 WIB`,
    },
    mySlot2 && {
      id: 'nt-seed-2',
      title: 'Booking Disetujui',
      body: `${mySlot2.roomCode} · ${activeSecondaryDay.label}, ${formatHourRange(mySlot2.startHour, mySlot2.duration)} · Kode SH-7P2N8`,
      category: 'booking',
      at: `${today.key} · 07:40 WIB`,
    },
    {
      id: 'nt-seed-3',
      title: 'Favorit Ditambahkan',
      body: 'L4 Lab 5A disimpan ke daftar Ruang Favorit',
      category: 'favorite',
      at: `${yesterday.key} · 16:20 WIB`,
    },
    {
      id: 'nt-seed-4',
      title: 'Booking Dibatalkan',
      body: 'L5 103 (SH-5T1W6) berhasil dibatalkan sebelum jam mulai.',
      category: 'cancel',
      at: `${yesterday.key} · 14:05 WIB`,
    },
    reports[0] && {
      id: 'nt-seed-5',
      title: 'Info Laporan Lapangan',
      body: `Ruang ${reports[0].room_code} ditandai sedang dipakai pada pukul ${String(reports[0].report_hour).padStart(2, '0')}.00 WIB.`,
      category: 'report',
      at: `${today.key} · 07:10 WIB`,
    },
  ].filter(Boolean);

  return { bookings, reports, favoritesMap, notifications };
}
