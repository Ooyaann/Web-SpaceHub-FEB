import { Compass, LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';
import { getNavGroups } from './Sidebar';

export default function MobileNav() {
  const {
    isAdmin,
    activeView,
    navigate,
    logout,
    favorites,
    myActiveBookingCount,
    notifications,
    syncing,
    refreshData,
  } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();

  const items = getNavGroups(isAdmin).flatMap((g) => g.items);
  const currentNav = activeView === 'det' || activeView === 'bk' ? 'find' : activeView;

  const getBadge = (id) => {
    if (id === 'favs') return favorites.size;
    if (id === 'mine') return myActiveBookingCount;
    if (id === 'notif') return notifications.length;
    return 0;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line-light bg-surface-light/95 backdrop-blur-md dark:border-line-dark dark:bg-surface-dark/95 lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? 'admin' : 'find')}
          className="flex items-center gap-2 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-gold dark:bg-brand-dark/20">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            Space<span className="text-brand dark:text-brand-dark">Hub</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            aria-label="Muat ulang"
            className="rounded-lg border border-line-light p-1.5 text-slate-500 dark:border-line-dark dark:text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah tema"
            className="rounded-lg border border-line-light p-1.5 text-slate-500 dark:border-line-dark dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg border border-line-light p-1.5 text-slate-500 dark:border-line-dark dark:text-slate-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav aria-label="Navigasi mobile" className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-0.5">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = currentNav === id;
          const badge = getBadge(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-brand text-white dark:bg-brand-dark'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
