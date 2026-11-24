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

const USER_SESSION_KEY = 'spacehub_session_user_v1';
const NOTIF_STORAGE_KEY = 'spacehub_notifications_v1';

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

  const [activeView, setActiveView] = useState('find');
  const [selectedRoomCode, setSelectedRoomCode] = useState(null);
  const nowWib = getNowWib();
  const days = useMemo(() => getNext31DaysWib(), [nowWib.dateKey]);
  const isAfterHours = nowWib.hour >= 16;

  const [detailDayIndex, setDetailDayIndex] = useState(() => (isAfterHours ? 1 : 0));
  const [bookingPresetDay, setBookingPresetDay] = useState(() => (isAfterHours ? 1 : 0));
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [filters, setFilters] = useState(() => ({
    day: isAfterHours ? 1 : 0,
    start: isAfterHours ? 8 : clampStartHour(nowWib.hour),
    dur: 2,
    floorKey: '',
    cap: 0,
    sort: 'cap',
    facilities: [],
    favOnly: false,
    search: '',
  }));

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3400);
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
        showToast(err?.message || 'Gagal memuat data dari server.', 'error');
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

      setUser(res.user);
      try {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(res.user));
      } catch {
        // ignore
      }
      setActiveView('find');
      showToast(
        mode === 'register'
          ? `Akun berhasil dibuat. Selamat datang, ${res.user.name}!`
          : `Selamat datang kembali, ${res.user.name}!`,
        'success'
      );
      return res;
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAdminUnlocked(false);
    setSelectedRoomCode(null);
    setActiveView('find');
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      // ignore
    }
    showToast('Kamu telah keluar dari SpaceHub.');
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
      facilities: [],
      favOnly: false,
      search: '',
    });
  }, []);

  const openRoomDetail = useCallback(
    (roomCode, dayIdx = filters.day) => {
      setSelectedRoomCode(roomCode);
      setDetailDayIndex(dayIdx);
      setActiveView('det');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters.day]
  );

  const openBookingForm = useCallback((roomCode, dayIdx) => {
    setSelectedRoomCode(roomCode);
    setBookingPresetDay(dayIdx);
    setActiveView('bk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigate = useCallback((view) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleFavorite = useCallback(
    async (roomCode) => {
      if (!user) return;
      const res = await toggleFavoriteSafe({ userEmail: user.email, roomCode });
      if (!res?.ok) {
        showToast(res?.error || 'Gagal mengubah favorit.', 'error');
        return;
      }

      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(roomCode);
        else next.delete(roomCode);
        return next;
      });

      const msg = res.favorited
        ? `Ruang ${roomCode} disimpan ke Favorit.`
        : `Ruang ${roomCode} dihapus dari Favorit.`;
      showToast(msg, 'success');
      pushNotification(res.favorited ? 'Ruang Disimpan ke Favorit' : 'Ruang Dihapus dari Favorit', msg, 'favorite');
    },
    [user, showToast, pushNotification]
  );

  const reportRoomUsed = useCallback(
    async (roomCode) => {
      if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };
      const current = getNowWib();
      if (current.hour < 7 || current.hour > 16) {
        const errMsg = 'Pelaporan ruang terpakai hanya berlaku pada jam operasional 07.00–17.00 WIB.';
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
      const msg = `Terima kasih, ruang ${roomCode} ditandai sedang terpakai untuk jam ${String(current.hour).padStart(2, '0')}.00 WIB.`;
      showToast(msg, 'success');
      pushNotification('Laporan Ruang Terpakai', msg, 'report');
      return { ok: true };
    },
    [user, refreshData, showToast, pushNotification]
  );

  const submitBooking = useCallback(
    async ({ roomCode, dayIndex, startHour, duration, nim, purpose, participants }) => {
      if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };
      const targetDay = days[dayIndex];
      if (!targetDay) return { ok: false, error: 'Tanggal tidak valid.' };

      const current = getNowWib();
      // Guard Frontend Wajib: memblokir slot "Ada kelas" (jadwal kuliah contoh), bentrok, maupun jam lewat sebelum memanggil RPC
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
          error: 'Slot waktu ini tidak kosong (ada jadwal kuliah, sudah dipesan, atau jam sudah lewat). Pilih jam lain.',
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

      // Simpan NIM terakhir di sesi agar tidak perlu mengetik ulang di booking berikutnya
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
      const detailMsg = `Booking ruang ${roomCode} (${targetDay.label}, ${formatHourRange(startHour, duration)}) berhasil dikonfirmasi dengan kode ${code}.`;
      showToast(`Booking berhasil! Kode: ${code}`, 'success');
      pushNotification('Booking Disetujui Otomatis', detailMsg, 'booking');
      setActiveView('mine');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return res;
    },
    [user, days, bookings, reports, refreshData, showToast, pushNotification]
  );

  const cancelBooking = useCallback(
    async (booking) => {
      if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };
      const res = await cancelBookingSafe({ bookingId: booking.id, userEmail: user.email });
      if (!res?.ok) {
        showToast(res?.error || 'Gagal membatalkan booking.', 'error');
        return res;
      }

      await refreshData(true);
      const msg = `Booking ruang ${booking.room_code} (kode ${booking.id}) dibatalkan. Slot kini terbuka kembali untuk pengguna lain.`;
      showToast('Booking berhasil dibatalkan.', 'success');
      pushNotification('Booking Dibatalkan', msg, 'cancel');
      return res;
    },
    [user, refreshData, showToast, pushNotification]
  );

  const unlockAdmin = useCallback(
    (pin) => {
      if (String(pin || '').trim().toLowerCase() === ADMIN_PIN) {
        setAdminUnlocked(true);
        showToast('Akses Halaman Pengelola dibuka.', 'success');
        return true;
      }
      return false;
    },
    [showToast]
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

  const value = {
    user,
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
    selectedRoomCode,
    detailDayIndex,
    setDetailDayIndex,
    bookingPresetDay,
    filters,
    updateFilter,
    toggleFacilityFilter,
    resetFilters,
    adminUnlocked,
    unlockAdmin,
    toast,
    showToast,
    clearNotifications,
    refreshData,
    loginOrRegister,
    logout,
    navigate,
    openRoomDetail,
    openBookingForm,
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
