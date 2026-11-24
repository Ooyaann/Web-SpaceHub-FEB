import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
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
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-unnes-navy/90 bg-unnes-navy px-4 py-5 text-white dark:border-unnes-night-line dark:bg-unnes-night-rail lg:flex">
      {/* Pure Prototype Wordmark: Space + yellow Hub (No compass icon) */}
      <div className="flex items-center justify-between px-1 pb-6">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? 'admin' : 'find')}
          className="text-left"
        >
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.03em] text-white">
            Space<span className="text-unnes-gold">Hub</span>
          </div>
          <div className="mt-1 text-[10px] font-semibold tracking-wider text-[#9BB2DF]">
            {isAdmin ? 'PORTAL PENGELOLA' : 'FEB UNNES'}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Ubah tema"
          className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-[#C7D7F5] transition hover:bg-white/15 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="Menu utama">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#7A94C9]">
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
                    className={`relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
                      isActive
                        ? 'bg-white/12 font-bold text-white'
                        : 'font-medium text-[#BDCEF0] hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-unnes-gold" />
                    )}
                    <span className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-unnes-gold' : 'text-[#89A2D4]'}`} />
                      {label}
                    </span>
                    {badge > 0 && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isActive
                            ? 'bg-unnes-gold text-unnes-gold-ink'
                            : 'bg-white/10 text-[#DCE7FA]'
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

      <div className="mt-4 space-y-3 border-t border-white/12 pt-4">
        <div className="flex items-center justify-between rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-[#BDCEF0]">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-unnes-gold'}`}
            />
            {isSupabaseConfigured ? 'Supabase Aktif' : 'Demo Lokal'}
          </span>
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            title="Sinkronkan data"
            className="rounded p-1 transition hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">{user?.name}</div>
            <div className="truncate text-[10px] text-[#8EA6D6]">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="rounded-lg border border-white/15 p-1.5 text-[#BDCEF0] transition hover:border-rose-400/50 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
