import { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Grid2x2,
  LogOut,
  Map,
  Menu,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';

const STUDENT_BOTTOM_TABS = [
  { id: 'find', label: 'Cari', icon: Search },
  { id: 'plan', label: 'Denah', icon: Map },
  { id: 'sched', label: 'Jadwal', icon: Grid2x2 },
  { id: 'cal', label: 'Kalender', icon: CalendarDays },
  { id: 'mine', label: 'Booking', icon: ClipboardList },
];

const ADMIN_BOTTOM_TABS = [
  { id: 'admin', label: 'Kelola', icon: ShieldCheck },
  { id: 'find', label: 'Cari', icon: Search },
  { id: 'plan', label: 'Denah', icon: Map },
  { id: 'sched', label: 'Jadwal', icon: Grid2x2 },
  { id: 'cal', label: 'Kalender', icon: CalendarDays },
];

export default function MobileNav() {
  const {
    user,
    isAdmin,
    activeView,
    selectedRoomCode,
    backLabel,
    goBack,
    navigate,
    logout,
    favorites,
    notifications,
    syncing,
    refreshData,
    isSupabaseConfigured,
  } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDrilldown = activeView === 'det' || activeView === 'bk';

  const handleDrawerNav = (view) => {
    setDrawerOpen(false);
    navigate(view);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-unnes-navy text-white shadow-sm dark:border-ink-line dark:bg-ink-rail lg:hidden">
        {isDrilldown ? (
          <div className="flex h-14 items-center justify-between gap-2 px-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white active:scale-95 dark:bg-ink-subtle"
            >
              <ArrowLeft className="h-4 w-4 flex-none text-unnes-gold" />
              <span className="truncate">Kembali ke {backLabel}</span>
            </button>

            <div className="flex items-center gap-1">
              {selectedRoomCode && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs font-bold text-unnes-gold dark:bg-ink-card">
                  {selectedRoomCode}
                </span>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ubah tema"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#D0DCF4] active:scale-95"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-14 items-center justify-between px-3.5">
            <button
              type="button"
              onClick={() => navigate(isAdmin ? 'admin' : 'find')}
              className="flex items-baseline gap-1.5 text-left"
            >
              <span className="text-[19px] font-extrabold tracking-[-0.03em] text-white">
                Space<span className="text-unnes-gold">Hub</span>
              </span>
              <span className="text-[11px] font-medium text-[#A8BCE2] dark:text-[#8A93A6]">
                {isAdmin ? 'Pengelola' : 'FEB'}
              </span>
            </button>

            <div className="flex items-center gap-0.5">
              {!isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('favs')}
                    aria-label="Ruang Favorit"
                    className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
                      activeView === 'favs' ? 'bg-white/15 text-unnes-gold' : 'text-[#D0DCF4]'
                    }`}
                  >
                    <Star className="h-4 w-4" />
                    {favorites.size > 0 && (
                      <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-unnes-gold px-1 text-[9px] font-extrabold text-unnes-gold-ink">
                        {favorites.size}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('notif')}
                    aria-label="Notifikasi"
                    className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
                      activeView === 'notif' ? 'bg-white/15 text-unnes-gold' : 'text-[#D0DCF4]'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-unnes-gold px-1 text-[9px] font-extrabold text-unnes-gold-ink">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ubah tema"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#D0DCF4] active:scale-95"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Buka menu lainnya"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white active:scale-95"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Sheet (Akun, Favorit, Notifikasi, Alur Sistem, Sinkron, Keluar) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-[2px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="animate-sheet-in w-full max-w-md rounded-2xl border border-[#E4E7EE] bg-white p-4 shadow-popover dark:border-ink-line-strong dark:bg-ink-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECEFF4] pb-3.5 dark:border-ink-line">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[#101828] dark:text-[#F5F7FA]">{user?.name}</div>
                <div className="truncate text-xs text-[#667085] dark:text-[#8A93A6]">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F8] dark:text-[#B0B8C9] dark:hover:bg-ink-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {!isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDrawerNav('favs')}
                    className="flex items-center gap-2.5 rounded-xl border border-[#E4E7EE] bg-[#F8F9FB] p-3 text-left text-xs font-semibold text-[#101828] active:scale-[0.98] dark:border-ink-line dark:bg-ink-subtle dark:text-[#F5F7FA]"
                  >
                    <Star className="h-4 w-4 text-unnes-gold" />
                    <span>Favorit ({favorites.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDrawerNav('notif')}
                    className="flex items-center gap-2.5 rounded-xl border border-[#E4E7EE] bg-[#F8F9FB] p-3 text-left text-xs font-semibold text-[#101828] active:scale-[0.98] dark:border-ink-line dark:bg-ink-subtle dark:text-[#F5F7FA]"
                  >
                    <Bell className="h-4 w-4 text-unnes-navy dark:text-unnes-gold" />
                    <span>Notifikasi ({notifications.length})</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleDrawerNav('flow')}
                className="flex items-center gap-2.5 rounded-xl border border-[#E4E7EE] bg-[#F8F9FB] p-3 text-left text-xs font-semibold text-[#101828] active:scale-[0.98] dark:border-ink-line dark:bg-ink-subtle dark:text-[#F5F7FA]"
              >
                <BookOpen className="h-4 w-4 text-unnes-navy dark:text-unnes-gold" />
                <span>Alur Sistem</span>
              </button>

              <button
                type="button"
                disabled={syncing}
                onClick={() => {
                  refreshData(true);
                  setDrawerOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-xl border border-[#E4E7EE] bg-[#F8F9FB] p-3 text-left text-xs font-semibold text-[#101828] active:scale-[0.98] dark:border-ink-line dark:bg-ink-subtle dark:text-[#F5F7FA]"
              >
                <RefreshCw className={`h-4 w-4 text-[#16A34A] ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Sinkron...' : 'Sinkron jadwal'}</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#ECEFF4] pt-3 dark:border-ink-line">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] dark:text-[#8A93A6]">
                <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-[#10B981]' : 'bg-unnes-gold'}`} />
                {isSupabaseConfigured ? 'Supabase aktif' : 'Mode demo lokal'}
              </span>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 active:scale-95 dark:bg-[#2E1C22] dark:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar akun
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Fixed Bottom Tab Bar khusus Smartphone (< lg):
 * 5 menu utama selalu terjangkau ibu jari tanpa scroll horizontal.
 */
export function MobileBottomBar() {
  const { isAdmin, activeView, rootNavView, navigate, myActiveBookingCount } = useSpaceHub();

  // Pada layar drill-down (Detail / Form Booking), sembunyikan tab bawah agar fokus ke aksi utama
  if (activeView === 'det' || activeView === 'bk') return null;

  const tabs = isAdmin ? ADMIN_BOTTOM_TABS : STUDENT_BOTTOM_TABS;

  return (
    <nav
      aria-label="Menu utama bawah"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-[#E2E6EE] bg-white/95 backdrop-blur-md dark:border-ink-line dark:bg-ink-rail/95 lg:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = rootNavView === id;
          const showBadge = id === 'mine' && myActiveBookingCount > 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 transition-colors active:scale-95 ${
                isActive
                  ? 'font-bold text-unnes-navy dark:text-unnes-gold'
                  : 'font-medium text-[#667085] dark:text-[#8A93A6]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-7 rounded-full bg-unnes-navy dark:bg-unnes-gold" />
              )}
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-unnes-navy px-1 text-[9px] font-extrabold text-white dark:bg-unnes-gold dark:text-unnes-gold-ink">
                    {myActiveBookingCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
