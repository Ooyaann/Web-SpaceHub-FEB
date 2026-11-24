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

export const NAV_GROUPS = [
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
    title: 'Lainnya',
    items: [
      { id: 'admin', label: 'Pengelola', icon: ShieldCheck },
      { id: 'flow', label: 'Panduan', icon: BookOpen },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

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
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-unnes-border bg-white px-3.5 py-5 dark:border-unnes-border-dark dark:bg-[#0c152d] lg:flex">
      {/* Brand */}
      <div className="flex items-center justify-between px-1.5 pb-5">
        <button type="button" onClick={() => navigate('find')} className="flex items-center gap-2.5 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-unnes-navy text-unnes-gold shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-extrabold leading-none tracking-tight text-unnes-navy dark:text-white">
              Space<span className="text-unnes-blue dark:text-unnes-gold">Hub</span>
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              FEB UNNES
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Ubah tema"
          className="rounded-lg border border-unnes-border p-1.5 text-slate-500 transition hover:bg-unnes-surface dark:border-unnes-border-dark dark:text-slate-300 dark:hover:bg-[#19264a]"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-0.5" aria-label="Menu utama">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mb-1.5 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition ${
                      isActive
                        ? 'bg-unnes-navy text-white shadow-sm dark:bg-unnes-gold dark:text-unnes-gold-ink'
                        : 'text-slate-600 hover:bg-unnes-surface hover:text-unnes-navy dark:text-slate-300 dark:hover:bg-[#162244] dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-unnes-gold dark:text-unnes-gold-ink'
                            : 'text-slate-400 dark:text-slate-400'
                        }`}
                      />
                      {label}
                    </span>
                    {badge > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-unnes-gold text-unnes-gold-ink dark:bg-unnes-navy dark:text-white'
                            : 'bg-unnes-surface text-unnes-navy dark:bg-[#1d2d59] dark:text-unnes-gold'
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

      {/* Footer Status & User */}
      <div className="mt-4 space-y-2.5 border-t border-unnes-border pt-3.5 dark:border-unnes-border-dark">
        <div className="flex items-center justify-between rounded-xl bg-unnes-surface px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:bg-[#131f3f] dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`}
            />
            {isSupabaseConfigured ? 'Supabase' : 'Demo Lokal'}
          </span>
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            title="Sinkronkan"
            className="rounded-md p-1 transition hover:bg-white dark:hover:bg-[#1e2f5c] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-[#0f1d3d] dark:text-white">{user?.name}</div>
            <div className="truncate text-[10px] text-slate-400">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="rounded-lg border border-unnes-border p-1.5 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-unnes-border-dark dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
