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

const STUDENT_GROUPS = [
  {
    title: 'Eksplorasi',
    items: [
      { id: 'find', label: 'Cari Ruang', icon: Search },
      { id: 'plan', label: 'Denah Lantai', icon: Map },
      { id: 'sched', label: 'Jadwal Ruang', icon: Grid2x2 },
      { id: 'cal', label: 'Kalender', icon: CalendarDays },
    ],
  },
  {
    title: 'Aktivitas',
    items: [
      { id: 'mine', label: 'Booking Saya', icon: ClipboardList },
      { id: 'favs', label: 'Favorit', icon: Star },
      { id: 'notif', label: 'Notifikasi', icon: Bell },
    ],
  },
  {
    title: 'Bantuan',
    items: [{ id: 'flow', label: 'Alur Sistem', icon: BookOpen }],
  },
];

const ADMIN_GROUPS = [
  {
    title: 'Pengelolaan',
    items: [{ id: 'admin', label: 'Dashboard Pengelola', icon: ShieldCheck }],
  },
  {
    title: 'Pantau Ruang',
    items: [
      { id: 'find', label: 'Cari Ruang', icon: Search },
      { id: 'plan', label: 'Denah Lantai', icon: Map },
      { id: 'sched', label: 'Jadwal Ruang', icon: Grid2x2 },
      { id: 'cal', label: 'Kalender', icon: CalendarDays },
    ],
  },
];

export function getNavGroups(isAdmin) {
  return isAdmin ? ADMIN_GROUPS : STUDENT_GROUPS;
}

export default function Sidebar() {
  const {
    user,
    isAdmin,
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

  const groups = getNavGroups(isAdmin);
  const currentNav = activeView === 'det' || activeView === 'bk' ? 'find' : activeView;

  const getBadge = (id) => {
    if (id === 'favs') return favorites.size;
    if (id === 'mine') return myActiveBookingCount;
    if (id === 'notif') return notifications.length;
    return 0;
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-line-light bg-surface-light px-3.5 py-5 dark:border-line-dark dark:bg-surface-dark lg:flex">
      <div className="flex items-center justify-between px-1.5 pb-6">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? 'admin' : 'find')}
          className="flex items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-gold shadow-sm dark:bg-brand-dark/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
              Space<span className="text-brand dark:text-brand-dark">Hub</span>
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Portal Pengelola' : 'FEB UNNES'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Ubah tema"
          className="rounded-lg border border-line-light p-1.5 text-slate-500 transition hover:bg-slate-100 dark:border-line-dark dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Menu utama">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon }) => {
                const isActive = currentNav === id;
                const badge = getBadge(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(id)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13px] transition ${
                      isActive
                        ? 'bg-brand/10 font-bold text-brand dark:bg-brand-dark/15 dark:text-blue-300'
                        : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-brand dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      {label}
                    </span>
                    {badge > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-brand text-white dark:bg-brand-dark'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-3 border-t border-line-light pt-4 dark:border-line-dark">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:bg-surface-subtle-dark dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`}
            />
            {isSupabaseConfigured ? 'Supabase Aktif' : 'Demo Lokal'}
          </span>
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            title="Sinkronkan data"
            className="rounded-md p-1 transition hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{user?.name}</div>
            <div className="truncate text-[10px] text-slate-400">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="rounded-lg border border-line-light p-1.5 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-line-dark dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
