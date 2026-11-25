import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_PIN, FALLBACK_ROOMS } from '../lib/constants';
import { clampStartHour, formatHour, formatHourRange, getNext31DaysWib, getNowWib } from '../lib/dateWib';
import { isBookingActive, isWindowFree } from '../lib/schedule';
import {
  adminCreateBlockSafe,
  adminDeleteRoomSafe,
  adminManageStatusSafe,
  adminUpsertRoomSafe,
  authUnnesUser,
  cancelBookingSafe,
  createBookingSafe,
  fetchAllData,
  getLocalNotifications,
  isSupabaseConfigured,
  reportRoomUsedSafe,
  saveLocalNotifications,
  toggleFavoriteSafe,
} from '../lib/supabase';
import {
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  sendSystemNotification,
} from '../lib/systemNotification';

const SpaceHubContext = createContext(null);

const USER_SESSION_KEY = 'spacehub_session_user_v2';
const SNAPSHOT_PREFIX = 'spacehub_my_bk_snap_v1_';
const UNREAD_KEY = 'spacehub_unread_notif_v1';

export const VIEW_LABELS = {
  find: 'Cari Ruang',
  plan: 'Denah Lantai',
  sched: 'Jadwal Ruang',
  cal: 'Kalender',
  mine: 'Booking Saya',
  favs: 'Ruang Favorit',
  notif: 'Notifikasi',
  flow: 'Alur Sistem',
  admin: 'Dashboard Pengelola',
  det: 'Detail Ruang',
  bk: 'Form Booking',
};

function loadSessionUser() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SpaceHubProvider({ children }) {
  const [user, setUser] = useState(loadSessionUser);
  const [notifPermission, setNotifPermission] = useState(getSystemNotificationPermission);
  const [rooms, setRooms] = useState(FALLBACK_ROOMS);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [notifications, setNotifications] = useState(getLocalNotifications);
  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const saved = localStorage.getItem(UNREAD_KEY);
      return saved !== null ? Number(saved) : 2;
    } catch {
      return 0;
    }
  });

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const nowWib = getNowWib();
  const days = useMemo(() => getNext31DaysWib(), [nowWib.dateKey]);
  const isAfterHours = nowWib.hour >= 16;

  const [activeView, setActiveView] = useState(() => (loadSessionUser()?.role === 'admin' ? 'admin' : 'find'));
  const [navHistory, setNavHistory] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState(null);
  const [detailDayIndex, setDetailDayIndex] = useState(() => (isAfterHours ? 1 : 0));
  const [bookingPresetDay, setBookingPresetDay] = useState(() => (isAfterHours ? 1 : 0));
  const [bookingPresetHour, setBookingPresetHour] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const selfCancelledIdsRef = useRef(new Set());
  const adminKnownBookingsRef = useRef(null);
  const adminKnownReportsRef = useRef(null);

  const [filters, setFilters] = useState(() => ({
    day: isAfterHours ? 1 : 0,
    start: isAfterHours ? 8 : clampStartHour(nowWib.hour),
    dur: 2,
    floorKey: '',
    cap: 0,
    sort: 'cap',
    priceType: 'all',
    facilities: [],
    favOnly: false,
    search: '',
  }));

  const [planPrefs, setPlanPrefs] = useState({
    building: 'L4',
    floor: 2,
  });

  const [schedPrefs, setSchedPrefs] = useState({
    building: 'L2',
    floorFilter: 'ALL',
    minConsecutive: 0,
    query: '',
  });

  const [calPrefs, setCalPrefs] = useState(() => ({
    selectedDayIdx: isAfterHours ? 1 : 0,
    scope: 'ALL',
    panelTab: 'booked',
    monthIdx: 0,
  }));

  const updateUnread = useCallback((updater) => {
    setUnreadCount((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(UNREAD_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  /**
   * Menampilkan Pop-up Heads-Up Notification di bagian atas layar HP/Desktop.
   * Mendukung string sederhana maupun objek lengkap { title, message, type, durationMs, actionLabel, actionView }.
   */
  const showToast = useCallback((messageOrOpts, type = 'info', extraOpts = {}) => {
    const opts =
      typeof messageOrOpts === 'object' && messageOrOpts !== null
        ? messageOrOpts
        : { message: messageOrOpts, type, ...extraOpts };

    const durationMs = opts.durationMs || (opts.type === 'warning' || opts.type === 'error' ? 6500 : 4200);
    setToast({
      id: Date.now() + Math.random(),
      title: opts.title || '',
      message: opts.message || '',
      type: opts.type || 'info',
      actionLabel: opts.actionLabel || '',
      actionView: opts.actionView || '',
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch {
      // ignore
    }

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, durationMs);
  }, []);

  const pushNotification = useCallback(
    (title, body, category = 'info', nativeOpts = null) => {
      const { timeLabel, dateKey } = getNowWib();
      const item = {
        id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        body,
        category,
        at: `${dateKey} · ${timeLabel}`,
      };
      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, 50);
        saveLocalNotifications(next);
        return next;
      });
      updateUnread((c) => c + 1);
      if (nativeOpts) {
        const opts = typeof nativeOpts === 'object' ? nativeOpts : {};
        sendSystemNotification({
          title: opts.title || `SpaceHub — ${title}`,
          body: opts.body || body,
          tag: opts.tag || `sh-nt-${Date.now()}`,
          view: opts.view || 'mine',
        });
      }
    },
    [updateUnread]
  );

  const enableSystemNotifications = useCallback(async () => {
    const result = await requestSystemNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      showToast({
        title: 'Notifikasi Sistem HP Aktif!',
        message: 'Tarik layar atas HP kamu — contoh notifikasi SpaceHub baru saja dikirim.',
        type: 'success',
        durationMs: 5500,
      });
      await sendSystemNotification({
        title: 'SpaceHub FEB — Notifikasi Aktif!',
        body: 'Tiket booking & info dari Pengelola kini muncul di panel notifikasi atas HP kamu.',
        tag: `sh-welcome-${Date.now()}`,
        view: user?.role === 'admin' ? 'admin' : 'mine',
      });
    } else if (result === 'denied') {
      showToast({
        title: 'Izin Notifikasi Diblokir Browser',
        message: 'Ketuk ikon pengaturan di sebelah kiri alamat URL Chrome, lalu ubah Notifikasi menjadi Izinkan.',
        type: 'warning',
        durationMs: 6500,
      });
    }
    return result;
  }, [showToast, user]);

  const testSystemNotification = useCallback(async () => {
    let currentPerm = getSystemNotificationPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestSystemNotificationPermission();
    }
    setNotifPermission(currentPerm);

    const sampleTitle = 'Booking Dikonfirmasi · L2 301';
    const sampleBody = 'Besok, 09.00–11.00 WIB · Kode Tiket SH-9K4M2 (Contoh Notifikasi)';

    showToast({
      title: sampleTitle,
      message: sampleBody,
      type: 'success',
      actionLabel: 'Lihat Tiket',
      actionView: 'mine',
    });

    if (currentPerm === 'granted') {
      await sendSystemNotification({
        title: sampleTitle,
        body: sampleBody,
        tag: `sh-test-${Date.now()}`,
        view: user?.role === 'admin' ? 'admin' : 'mine',
      });
    } else if (currentPerm === 'denied') {
      showToast({
        title: 'Notifikasi Sistem HP Diblokir',
        message: 'Ketuk ikon pengaturan di kiri URL Chrome → Izin → Notifikasi → Izinkan agar muncul di bar atas HP.',
        type: 'warning',
        durationMs: 6500,
      });
    }
  }, [showToast, user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    saveLocalNotifications([]);
    updateUnread(0);
    showToast({ title: 'Notifikasi Dibersihkan', message: 'Seluruh riwayat notifikasi telah dihapus.', type: 'info' });
  }, [showToast, updateUnread]);

  /**
   * Mendeteksi perubahan lintas perangkat (misal Pengelola membatalkan/menghapus booking mahasiswa,
   * atau mahasiswa membuat booking/laporan baru saat Pengelola membuka dashboard).
   */
  const detectCrossDeviceEvents = useCallback(
    (currentUser, fetchedBookings, fetchedReports) => {
      if (!currentUser) return;

      if (currentUser.role === 'student') {
        const snapKey = `${SNAPSHOT_PREFIX}${currentUser.email.toLowerCase()}`;
        const myCurrent = fetchedBookings.filter(
          (b) => (b.user_email || '').toLowerCase() === currentUser.email.toLowerCase()
        );

        let prevSnap = null;
        try {
          const raw = localStorage.getItem(snapKey);
          prevSnap = raw ? JSON.parse(raw) : null;
        } catch {
          prevSnap = null;
        }

        if (prevSnap) {
          const currentMap = new Map(myCurrent.map((b) => [b.id, b]));
          for (const [oldId, oldData] of Object.entries(prevSnap)) {
            if (oldData.status !== 'confirmed') continue;
            if (selfCancelledIdsRef.current.has(oldId)) {
              selfCancelledIdsRef.current.delete(oldId);
              continue;
            }
            const nowItem = currentMap.get(oldId);
            if (!nowItem || nowItem.status === 'cancelled') {
              const title = 'Booking Dibatalkan Pengelola';
              const msg = `Jadwal ${oldData.room_code} (${formatHourRange(
                oldData.start_hour,
                oldData.duration
              )} · ${oldId}) telah dibatalkan oleh Pengelola.`;
              showToast({
                title,
                message: msg,
                type: 'warning',
                durationMs: 7500,
                actionLabel: 'Cari Ruang Lain',
                actionView: 'find',
              });
              pushNotification(title, msg, 'cancel', {
                title,
                body: msg,
                tag: `sh-adm-cancel-${oldId}`,
                view: 'find',
              });
            }
          }
        }

        const nextSnap = {};
        for (const b of myCurrent) {
          nextSnap[b.id] = {
            status: b.status,
            room_code: b.room_code,
            booking_date: b.booking_date,
            start_hour: b.start_hour,
            duration: b.duration,
          };
        }
        try {
          localStorage.setItem(snapKey, JSON.stringify(nextSnap));
        } catch {
          // ignore
        }
      } else if (currentUser.role === 'admin') {
        const currentBkIds = new Set(fetchedBookings.map((b) => b.id));
        const currentRepIds = new Set(fetchedReports.map((r) => String(r.id)));

        if (adminKnownBookingsRef.current !== null) {
          const newBk = fetchedBookings.find(
            (b) =>
              !adminKnownBookingsRef.current.has(b.id) &&
              (b.user_email || '').toLowerCase() !== 'pengelola@unnes.ac.id'
          );
          if (newBk) {
            const title = 'Booking Baru Masuk';
            const msg = `${newBk.user_name} mem-booking ${newBk.room_code} (${formatHourRange(
              newBk.start_hour,
              newBk.duration
            )}) · ${newBk.id}`;
            showToast({
              title,
              message: msg,
              type: 'success',
              durationMs: 6000,
              actionLabel: 'Lihat Booking',
              actionView: 'admin',
            });
            sendSystemNotification({
              title: `Booking Baru · ${newBk.room_code}`,
              body: msg,
              tag: `sh-new-bk-${newBk.id}`,
              view: 'admin',
            });
          }
        }

        if (adminKnownReportsRef.current !== null) {
          const newRep = fetchedReports.find((r) => !adminKnownReportsRef.current.has(String(r.id)));
          if (newRep && (newRep.reported_by || '').toLowerCase() !== 'pengelola@unnes.ac.id') {
            const title = 'Laporan Lapangan Baru';
            const msg = `Ruang ${newRep.room_code} dilaporkan sedang terpakai pukul ${formatHour(
              newRep.report_hour
            )} WIB.`;
            showToast({
              title,
              message: msg,
              type: 'warning',
              durationMs: 6000,
            });
            sendSystemNotification({
              title: `Laporan Ruang · ${newRep.room_code}`,
              body: msg,
              tag: `sh-new-rep-${newRep.id}`,
              view: 'admin',
            });
          }
        }

        adminKnownBookingsRef.current = currentBkIds;
        adminKnownReportsRef.current = currentRepIds;
      }
    },
    [showToast, pushNotification]
  );

  const refreshData = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (silent) setSyncing(true);
      else setLoading(true);

      try {
        const data = await fetchAllData(user.email);
        setRooms(data.rooms);
        setBookings(data.bookings);
        setReports(data.reports);
        setFavorites(data.favorites);
        detectCrossDeviceEvents(user, data.bookings, data.reports);
      } catch (err) {
        if (!silent) {
          showToast({ title: 'Gagal Memuat Data', message: err?.message || 'Periksa koneksi internet.', type: 'error' });
        }
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [user, showToast, detectCrossDeviceEvents]
  );

  useEffect(() => {
    if (user) {
      refreshData(false);
    } else {
      adminKnownBookingsRef.current = null;
      adminKnownReportsRef.current = null;
    }
  }, [user, refreshData]);

  // Sinkronisasi berkala setiap 12 detik & saat tab kembali dibuka agar pop-up lintas perangkat muncul otomatis
  useEffect(() => {
    if (!user) return undefined;
    const handleVisibility = () => {
      setNotifPermission(getSystemNotificationPermission());
      if (document.visibilityState === 'visible') {
        refreshData(true);
      }
    };
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData(true);
      }
    }, 12000);

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, refreshData]);

  // Tangkap klik pada Notifikasi Sistem HP (Service Worker) untuk langsung membuka halaman terkait
  useEffect(() => {
    if (!user) return undefined;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      if (urlView && VIEW_LABELS[urlView]) {
        setActiveView(user.role === 'admin' ? 'admin' : urlView);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // ignore
    }

    if (!('serviceWorker' in navigator)) return undefined;
    const onSwMessage = (event) => {
      if (event.data?.type === 'SH_NOTIF_CLICK' && event.data.view) {
        setNavHistory([]);
        setActiveView(user.role === 'admin' ? 'admin' : event.data.view);
      }
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [user]);

  const loginOrRegister = useCallback(
    async ({ email, password, fullName, mode }) => {
      const res = await authUnnesUser({ email, password, fullName, mode });
      if (!res?.ok) return res;

      const sessionUser = { ...res.user, role: 'student' };
      setUser(sessionUser);
      try {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionUser));
      } catch {
        // ignore
      }
      setNavHistory([]);
      setActiveView('find');
      showToast({
        title: `Selamat datang, ${sessionUser.name}!`,
        message: 'Pilih tanggal dan jam untuk mencari ruang kelas kosong.',
        type: 'success',
      });
      return res;
    },
    [showToast]
  );

  const loginAsAdmin = useCallback(
    (pin) => {
      if (String(pin || '').trim().toLowerCase() !== ADMIN_PIN) {
        return { ok: false, error: 'PIN Pengelola tidak sesuai.' };
      }
      const adminUser = {
        email: 'pengelola@unnes.ac.id',
        name: 'Pengelola FEB',
        nim: '',
        role: 'admin',
      };
      setUser(adminUser);
      try {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(adminUser));
      } catch {
        // ignore
      }
      setNavHistory([]);
      setActiveView('admin');
      showToast({
        title: 'Portal Pengelola Aktif',
        message: 'Notifikasi booking & laporan baru akan muncul otomatis di layar.',
        type: 'success',
      });
      return { ok: true, user: adminUser };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    setSelectedRoomCode(null);
    setNavHistory([]);
    setActiveView('find');
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      // ignore
    }
    showToast({ title: 'Berhasil Keluar', message: 'Sesi akun telah diakhiri.', type: 'info' });
  }, [showToast]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFacilityFilter = useCallback((facility) => {
    setFilters((prev) => {
      const exists = prev.facilities.includes(facility);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    const current = getNowWib();
    const afterHours = current.hour >= 16;
    setFilters({
      day: afterHours ? 1 : 0,
      start: afterHours ? 8 : clampStartHour(current.hour),
      dur: 2,
      floorKey: '',
      cap: 0,
      sort: 'cap',
      priceType: 'all',
      facilities: [],
      favOnly: false,
      search: '',
    });
  }, []);

  const navigate = useCallback(
    (view) => {
      setNavHistory([]);
      setActiveView(view);
      if (view === 'notif') {
        updateUnread(0);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateUnread]
  );

  const openRoomDetail = useCallback(
    (roomCode, dayIdx = filters.day) => {
      setSelectedRoomCode(roomCode);
      setDetailDayIndex(dayIdx);
      setNavHistory((prev) => {
        if (activeView === 'det') return prev;
        if (activeView === 'bk') return prev.length > 0 ? prev.filter((v) => v !== 'det') : ['find'];
        return [...prev, activeView];
      });
      setActiveView('det');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters.day, activeView]
  );

  const openBookingForm = useCallback(
    (roomCode, dayIdx, presetHour = null) => {
      setSelectedRoomCode(roomCode);
      setBookingPresetDay(dayIdx);
      setBookingPresetHour(presetHour);
      setNavHistory((prev) => {
        if (activeView === 'bk') return prev;
        return [...prev, activeView];
      });
      setActiveView('bk');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeView]
  );

  const goBack = useCallback(() => {
    const defaultHome = user?.role === 'admin' ? 'admin' : 'find';
    if (navHistory.length === 0) {
      setActiveView(defaultHome);
    } else {
      const target = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setActiveView(target);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navHistory, user]);

  const goToFindWithDate = useCallback((dayIdx) => {
    setFilters((prev) => ({
      ...prev,
      day: dayIdx,
      start: dayIdx === 0 ? clampStartHour(getNowWib().hour) : 8,
    }));
    setNavHistory([]);
    setActiveView('find');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleFavorite = useCallback(
    async (roomCode) => {
      if (!user) return;
      if (user.role === 'admin') {
        showToast('Fitur favorit tersedia pada akun mahasiswa.');
        return;
      }
      const res = await toggleFavoriteSafe({ userEmail: user.email, roomCode });
      if (!res?.ok) {
        showToast({ title: 'Gagal', message: res?.error || 'Gagal memperbarui favorit.', type: 'error' });
        return;
      }

      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(roomCode);
        else next.delete(roomCode);
        return next;
      });

      const title = res.favorited ? 'Disimpan ke Favorit' : 'Dihapus dari Favorit';
      const msg = res.favorited
        ? `Ruang ${roomCode} ditambahkan ke daftar favoritmu.`
        : `Ruang ${roomCode} dihapus dari daftar favorit.`;
      showToast({ title, message: msg, type: 'info' });
      pushNotification(title, msg, 'favorite', false);
    },
    [user, showToast, pushNotification]
  );

  const reportRoomUsed = useCallback(
    async (roomCode, customDate = null, customHour = null) => {
      if (!user) return { ok: false, error: 'Silakan login.' };
      const current = getNowWib();
      const repDate = customDate || current.dateKey;
      const repHour = customHour !== null ? Number(customHour) : current.hour;

      if (repHour < 7 || repHour > 16) {
        const errMsg = 'Pelaporan hanya tersedia pukul 07.00–17.00 WIB.';
        showToast({ title: 'Di Luar Jam Operasional', message: errMsg, type: 'warning' });
        return { ok: false, error: errMsg };
      }

      const res = await reportRoomUsedSafe({
        roomCode,
        reportDate: repDate,
        reportHour: repHour,
        reportedBy: user.email,
      });

      if (!res?.ok) {
        showToast({ title: 'Laporan Gagal', message: res?.error || 'Gagal mengirim laporan.', type: 'error' });
        return res;
      }

      await refreshData(true);
      const msg = `Ruang ${roomCode} ditandai sedang terpakai pukul ${String(repHour).padStart(2, '0')}.00 WIB.`;
      showToast({ title: 'Laporan Terkirim', message: msg, type: 'warning' });
      pushNotification('Laporan Terpakai', msg, 'report', false);
      return { ok: true };
    },
    [user, refreshData, showToast, pushNotification]
  );

  const submitBooking = useCallback(
    async ({ roomCode, dayIndex, startHour, duration, nim, purpose, participants }) => {
      if (!user) return { ok: false, error: 'Silakan login.' };
      const targetDay = days[dayIndex];
      if (!targetDay) return { ok: false, error: 'Tanggal tidak valid.' };

      const current = getNowWib();
      const slotFree = isWindowFree({
        roomCode,
        dateKey: targetDay.key,
        weekday: targetDay.weekday,
        startHour,
        duration,
        bookings,
        reports,
        userEmail: user.email,
        todayWib: current.dateKey,
        nowHourWib: current.hour,
      });

      if (!slotFree) {
        return {
          ok: false,
          error: 'Slot tidak kosong (ada jadwal kuliah, terisi, atau sudah lewat).',
        };
      }

      const res = await createBookingSafe({
        roomCode,
        bookingDate: targetDay.key,
        startHour,
        duration,
        userEmail: user.email,
        userName: user.name,
        nim,
        purpose,
        participants,
      });

      if (!res?.ok) {
        await refreshData(true);
        return res;
      }

      if (user.nim !== String(nim).trim()) {
        const updatedUser = { ...user, nim: String(nim).trim() };
        setUser(updatedUser);
        try {
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
        } catch {
          // ignore
        }
      }

      await refreshData(true);
      const code = res.booking?.id || 'SH-BOOK';
      const detailMsg = `Ruang ${roomCode} · ${targetDay.label}, ${formatHourRange(startHour, duration)} · Kode ${code}`;
      showToast({
        title: 'Booking Berhasil Dikonfirmasi!',
        message: detailMsg,
        type: 'success',
        durationMs: 5500,
      });
      pushNotification('Booking Disetujui', detailMsg, 'booking', {
        title: `Booking Dikonfirmasi · ${roomCode}`,
        body: detailMsg,
        tag: `sh-bk-${code}`,
        view: user.role === 'admin' ? 'admin' : 'mine',
      });
      setBookingPresetHour(null);
      setNavHistory([]);
      setActiveView(user.role === 'admin' ? 'admin' : 'mine');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return res;
    },
    [user, days, bookings, reports, refreshData, showToast, pushNotification]
  );

  const cancelBooking = useCallback(
    async (booking) => {
      if (!user) return { ok: false, error: 'Silakan login.' };
      selfCancelledIdsRef.current.add(booking.id);
      const res = await cancelBookingSafe({ bookingId: booking.id, userEmail: user.email });
      if (!res?.ok) {
        selfCancelledIdsRef.current.delete(booking.id);
        showToast({ title: 'Gagal Membatalkan', message: res?.error || 'Gagal membatalkan booking.', type: 'error' });
        return res;
      }

      await refreshData(true);
      const msg = `Booking Ruang ${booking.room_code} (${booking.id}) berhasil dibatalkan.`;
      showToast({ title: 'Booking Dibatalkan', message: msg, type: 'warning' });
      pushNotification('Booking Dibatalkan', msg, 'cancel', {
        title: `Booking Dibatalkan · ${booking.room_code}`,
        body: msg,
        tag: `sh-cancel-${booking.id}`,
        view: 'mine',
      });
      return res;
    },
    [user, refreshData, showToast, pushNotification]
  );

  const adminSaveRoom = useCallback(
    async (roomPayload) => {
      const res = await adminUpsertRoomSafe(roomPayload);
      if (!res?.ok) {
        showToast({ title: 'Gagal Menyimpan', message: res?.error || 'Gagal menyimpan ruangan.', type: 'error' });
        return res;
      }
      await refreshData(true);
      showToast({
        title: roomPayload.originalCode ? 'Data Ruang Diperbarui' : 'Ruang Baru Ditambahkan',
        message: `Ruang ${roomPayload.code} berhasil disimpan.`,
        type: 'success',
      });
      return res;
    },
    [refreshData, showToast]
  );

  const adminRemoveRoom = useCallback(
    async (roomCode) => {
      const res = await adminDeleteRoomSafe(roomCode);
      if (!res?.ok) {
        showToast({ title: 'Gagal Menghapus', message: res?.error || 'Gagal menghapus ruangan.', type: 'error' });
        return res;
      }
      await refreshData(true);
      showToast({ title: 'Ruangan Dihapus', message: `Ruang ${roomCode} telah dihapus dari sistem.`, type: 'warning' });
      return res;
    },
    [refreshData, showToast]
  );

  const adminCreateBlock = useCallback(
    async (payload) => {
      const res = await adminCreateBlockSafe(payload);
      if (!res?.ok) {
        showToast({ title: 'Gagal Memblokir Slot', message: res?.error || 'Slot sedang terisi.', type: 'error' });
        return res;
      }
      if (res.booking?.id && adminKnownBookingsRef.current) {
        adminKnownBookingsRef.current.add(res.booking.id);
      }
      await refreshData(true);
      showToast({
        title: 'Slot Berhasil Diblokir',
        message: `Ruang ${payload.roomCode} diblokir (${res.booking?.id}).`,
        type: 'success',
      });
      return res;
    },
    [refreshData, showToast]
  );

  const adminManageStatus = useCallback(
    async (action, targetId, successText) => {
      const res = await adminManageStatusSafe({ action, targetId });
      if (!res?.ok) {
        showToast({ title: 'Aksi Gagal', message: res?.error || 'Aksi gagal diproses.', type: 'error' });
        return res;
      }
      await refreshData(true);
      if (successText) {
        showToast({ title: 'Status Diperbarui', message: successText, type: 'success' });
      }
      return res;
    },
    [refreshData, showToast]
  );

  const myBookings = useMemo(() => {
    if (!user) return [];
    const email = user.email.toLowerCase();
    return bookings
      .filter((b) => (b.user_email || '').toLowerCase() === email)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1;
        return `${b.booking_date}-${String(b.start_hour).padStart(2, '0')}`.localeCompare(
          `${a.booking_date}-${String(a.start_hour).padStart(2, '0')}`
        );
      });
  }, [bookings, user]);

  const myActiveBookingCount = useMemo(() => {
    const current = getNowWib();
    return myBookings.filter((b) => isBookingActive(b, current.dateKey, current.hour)).length;
  }, [myBookings]);

  const isAdmin = user?.role === 'admin';
  const defaultRoot = isAdmin ? 'admin' : 'find';
  const rootNavView = navHistory.length > 0 ? navHistory[0] : activeView;
  const previousView = navHistory.length > 0 ? navHistory[navHistory.length - 1] : defaultRoot;
  const backLabel =
    previousView === 'det' && selectedRoomCode
      ? `Detail ${selectedRoomCode}`
      : VIEW_LABELS[previousView] || 'Cari Ruang';
  const rootNavLabel = VIEW_LABELS[rootNavView] || 'Cari Ruang';

  const value = {
    user,
    isAdmin,
    rooms,
    bookings,
    reports,
    favorites,
    notifications,
    unreadCount,
    notifPermission,
    enableSystemNotifications,
    testSystemNotification,
    loading,
    syncing,
    isSupabaseConfigured,
    days,
    nowWib,
    activeView,
    rootNavView,
    rootNavLabel,
    previousView,
    backLabel,
    selectedRoomCode,
    detailDayIndex,
    setDetailDayIndex,
    bookingPresetDay,
    bookingPresetHour,
    filters,
    updateFilter,
    toggleFacilityFilter,
    resetFilters,
    planPrefs,
    setPlanPrefs,
    schedPrefs,
    setSchedPrefs,
    calPrefs,
    setCalPrefs,
    toast,
    showToast,
    dismissToast,
    clearNotifications,
    refreshData,
    loginOrRegister,
    loginAsAdmin,
    logout,
    navigate,
    openRoomDetail,
    openBookingForm,
    goBack,
    goToFindWithDate,
    toggleFavorite,
    reportRoomUsed,
    submitBooking,
    cancelBooking,
    adminSaveRoom,
    adminRemoveRoom,
    adminCreateBlock,
    adminManageStatus,
    myBookings,
    myActiveBookingCount,
  };

  return <SpaceHubContext.Provider value={value}>{children}</SpaceHubContext.Provider>;
}

export function useSpaceHub() {
  const ctx = useContext(SpaceHubContext);
  if (!ctx) throw new Error('useSpaceHub harus digunakan di dalam SpaceHubProvider');
  return ctx;
}
