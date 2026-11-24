import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_PIN, FALLBACK_ROOMS } from '../lib/constants';
import { clampStartHour, formatHourRange, getNext31DaysWib, getNowWib } from '../lib/dateWib';
import { isBookingActive, isWindowFree } from '../lib/schedule';
import {
  authUnnesUser,
  cancelBookingSafe,
  createBookingSafe,
  fetchAllData,
  isSupabaseConfigured,
  reportRoomUsedSafe,
  toggleFavoriteSafe,
} from '../lib/supabase';

const SpaceHubContext = createContext(null);

const USER_SESSION_KEY = 'spacehub_session_user_v2';
const NOTIF_STORAGE_KEY = 'spacehub_notifications_v1';

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

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function SpaceHubProvider({ children }) {
  const [user, setUser] = useState(loadSessionUser);
  const [rooms, setRooms] = useState(FALLBACK_ROOMS);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [notifications, setNotifications] = useState(loadNotifications);

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

  // Persisted sub-view preferences so returning via Back keeps exact selections
  const [planPrefs, setPlanPrefs] = useState({
    building: 'L4',
    floor: 2,
  });

  const [schedPrefs, setSchedPrefs] = useState({
    building: 'L4',
    floorFilter: 'ALL',
    minConsecutive: 0,
    query: '',
  });

  const [calPrefs, setCalPrefs] = useState(() => ({
    selectedDayIdx: isAfterHours ? 1 : 0,
    scope: 'ALL',
    panelTab: 'idle',
    monthIdx: 0,
  }));

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const pushNotification = useCallback((title, body, category = 'info') => {
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
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(NOTIF_STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('Riwayat notifikasi dibersihkan.');
  }, [showToast]);

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
      } catch (err) {
        showToast(err?.message || 'Gagal memuat data.', 'error');
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [user, showToast]
  );

  useEffect(() => {
    if (user) {
      refreshData(false);
    }
  }, [user, refreshData]);

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
      showToast(`Halo, ${sessionUser.name}!`, 'success');
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
      showToast('Masuk sebagai Pengelola FEB.', 'success');
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
    showToast('Berhasil keluar.');
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

  // Navigate to a top-level menu view (clears sub-view history)
  const navigate = useCallback((view) => {
    setNavHistory([]);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Open Detail View while remembering exact origin view (Find, Denah, Jadwal, Kalender, Favorit, Booking Saya)
  const openRoomDetail = useCallback(
    (roomCode, dayIdx = filters.day) => {
      setSelectedRoomCode(roomCode);
      setDetailDayIndex(dayIdx);
      setNavHistory((prev) => {
        if (activeView === 'det') return prev;
        // If user clicked "Lihat detail ruang" while inside BookingView, keep their original menu root
        if (activeView === 'bk') return prev.length > 0 ? prev.filter((v) => v !== 'det') : ['find'];
        return [...prev, activeView];
      });
      setActiveView('det');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters.day, activeView]
  );

  // Open Booking Form while remembering exact previous screen (e.g. Jadwal Ruang '+' directly, or DetailView)
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

  // Contextual Back action: pops the exact previous view
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
        showToast(res?.error || 'Gagal memperbarui favorit.', 'error');
        return;
      }

      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(roomCode);
        else next.delete(roomCode);
        return next;
      });

      const msg = res.favorited ? `${roomCode} disimpan ke Favorit` : `${roomCode} dihapus dari Favorit`;
      showToast(msg, 'success');
      pushNotification(res.favorited ? 'Favorit Ditambahkan' : 'Favorit Dihapus', msg, 'favorite');
    },
    [user, showToast, pushNotification]
  );

  const reportRoomUsed = useCallback(
    async (roomCode) => {
      if (!user) return { ok: false, error: 'Silakan login.' };
      const current = getNowWib();
      if (current.hour < 7 || current.hour > 16) {
        const errMsg = 'Pelaporan hanya tersedia pukul 07.00–17.00 WIB.';
        showToast(errMsg, 'error');
        return { ok: false, error: errMsg };
      }

      const res = await reportRoomUsedSafe({
        roomCode,
        reportDate: current.dateKey,
        reportHour: current.hour,
        reportedBy: user.email,
      });

      if (!res?.ok) {
        showToast(res?.error || 'Gagal mengirim laporan.', 'error');
        return res;
      }

      await refreshData(true);
      const msg = `${roomCode} ditandai terpakai pukul ${String(current.hour).padStart(2, '0')}.00 WIB.`;
      showToast(msg, 'success');
      pushNotification('Laporan Terpakai', msg, 'report');
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
      const detailMsg = `${roomCode} · ${targetDay.label}, ${formatHourRange(startHour, duration)} · Kode ${code}`;
      showToast(`Booking dikonfirmasi (${code})`, 'success');
      pushNotification('Booking Disetujui', detailMsg, 'booking');
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
      const res = await cancelBookingSafe({ bookingId: booking.id, userEmail: user.email });
      if (!res?.ok) {
        showToast(res?.error || 'Gagal membatalkan booking.', 'error');
        return res;
      }

      await refreshData(true);
      const msg = `${booking.room_code} (${booking.id}) dibatalkan.`;
      showToast('Booking dibatalkan.', 'success');
      pushNotification('Booking Dibatalkan', msg, 'cancel');
      return res;
    },
    [user, refreshData, showToast, pushNotification]
  );

  const myBookings = useMemo(() => {
    if (!user) return [];
    const email = user.email.toLowerCase();
    return bookings
      .filter((b) => (b.user_email || '').toLowerCase() === email)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1;
        return `${a.booking_date}-${String(a.start_hour).padStart(2, '0')}`.localeCompare(
          `${b.booking_date}-${String(b.start_hour).padStart(2, '0')}`
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
