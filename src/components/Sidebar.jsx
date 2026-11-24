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
    title: 'Informasi',
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
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col bg-unnes-navy px-4 py-6 text-white dark:border-r dark:border-white/[0.06] dark:bg-ink-rail lg:flex">
      {/* Wordmark SpaceHub (Hub kuning UNNES) */}
      <div className="flex items-center justify-between px-2 pb-7">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? 'admin' : 'find')}
          className="text-left"
        >
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.03em] text-white">
            Space<span className="text-unnes-gold">Hub</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-[#A8BCE2] dark:text-[#7D8DA8]">
            {isAdmin ? 'Portal Pengelola' : 'FEB UNNES'}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          aria-label="Ubah tema"
          className="rounded-lg p-1.5 text-[#C2D3F2] transition hover:bg-white/10 hover:text-white dark:text-[#9AA7BE]"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto" aria-label="Menu utama">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-1.5 px-2.5 text-[11px] font-medium text-[#8BA3D1] dark:text-[#66758F]">
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
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
                      isActive
                        ? 'bg-white/14 font-semibold text-white dark:bg-ink-card'
                        : 'font-medium text-[#C4D3EE] hover:bg-white/[0.07] hover:text-white dark:text-[#9AA7BE] dark:hover:bg-white/[0.04] dark:hover:text-[#EEF2F7]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-unnes-gold' : 'text-[#8FA6D4] dark:text-[#6E7D97]'
                        }`}
                      />
                      {label}
                    </span>
                    {badge > 0 && (
                      <span
                        className={`tabular-nums text-[11px] font-semibold ${
                          isActive ? 'text-unnes-gold' : 'text-[#9BB2DC] dark:text-[#7D8DA8]'
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

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between px-2 text-[11px] font-medium text-[#9BB2DC] dark:text-[#7D8DA8]">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-unnes-gold'}`}
            />
            {isSupabaseConfigured ? 'Supabase aktif' : 'Demo lokal'}
          </span>
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            title="Sinkronkan data"
            className="rounded p-1 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white">{user?.name}</div>
            <div className="truncate text-[11px] text-[#8FA6D4] dark:text-[#6E7D97]">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            aria-label="Keluar"
            className="rounded-lg p-1.5 text-[#A8BCE2] transition hover:bg-white/10 hover:text-white dark:text-[#7D8DA8]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
