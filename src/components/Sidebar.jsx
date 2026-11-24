import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  Grid2x2,
  LogOut,
  Map,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Sun,
} from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';

export const NAV_ITEMS = [
  { id: 'find', label: 'Cari Ruang', icon: Search },
  { id: 'plan', label: 'Denah Lantai', icon: Map },
  { id: 'sched', label: 'Jadwal Ruang', icon: Grid2x2 },
  { id: 'cal', label: 'Kalender', icon: CalendarDays },
  { id: 'favs', label: 'Favorit', icon: Star },
  { id: 'mine', label: 'Booking Saya', icon: ClipboardList },
  { id: 'notif', label: 'Notifikasi', icon: Bell },
  { id: 'admin', label: 'Pengelola', icon: ShieldCheck },
  { id: 'flow', label: 'Alur Sistem', icon: BookOpen },
];

export default function Sidebar() {
  const {
    user,
    activeView,
    navigate,
    logout,
    favorites,
    myActiveBookingCount,
    notifications,
    syncing,
    refreshData,
    isSupabaseConfigured,
  } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();

  const currentNav = activeView === 'det' || activeView === 'bk' ? 'find' : activeView;

  const getBadge = (id) => {
    if (id === 'favs') return favorites.size;
    if (id === 'mine') return myActiveBookingCount;
    if (id === 'notif') return notifications.length;
    return 0;
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-none flex-col bg-unnes-navy px-3.5 py-5 text-white dark:bg-unnes-navy-deep lg:flex">
      <div className="flex items-center justify-between px-2 pb-5">
        <button
          type="button"
          onClick={() => navigate('find')}
          className="flex items-center gap-2 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-unnes-gold text-unnes-gold-ink shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none tracking-tight">
              Space<span className="text-unnes-gold">Hub</span>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-200/80">
              FEB UNNES
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Ubah tema terang atau gelap"
          className="rounded-lg bg-white/10 p-2 text-blue-100 transition hover:bg-white/20"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Menu utama">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentNav === id;
          const badge = getBadge(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex w-full items-center justify-between rounded-xl border-l-[3px] px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                isActive
                  ? 'border-unnes-gold bg-white/15 text-white shadow-sm'
                  : 'border-transparent text-blue-100/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-unnes-gold' : 'text-blue-200/80'}`} />
                {label}
              </span>
              {badge > 0 && (
                <span className="rounded-full bg-unnes-gold px-2 py-0.5 text-[11px] font-extrabold text-unnes-gold-ink">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 border-t border-white/15 pt-4">
        <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-blue-100">
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-300'
              }`}
            />
            {isSupabaseConfigured ? 'Supabase Aktif' : 'Mode Demo Lokal'}
          </span>
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            title="Muat ulang data terbaru"
            className="rounded-md p-1 text-blue-100 transition hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="px-1">
          <div className="truncate text-xs font-bold text-white">{user?.name}</div>
          <div className="truncate text-[11px] text-blue-200/80">{user?.email}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
