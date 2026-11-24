import { Compass, LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';
import { NAV_ITEMS } from './Sidebar';

export default function MobileNav() {
  const {
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

  const currentNav = activeView === 'det' || activeView === 'bk' ? 'find' : activeView;

  const getBadge = (id) => {
    if (id === 'favs') return favorites.size;
    if (id === 'mine') return myActiveBookingCount;
    if (id === 'notif') return notifications.length;
    return 0;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-unnes-border bg-white/95 backdrop-blur-md dark:border-unnes-border-dark dark:bg-[#0c152d]/95 lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <button type="button" onClick={() => navigate('find')} className="flex items-center gap-2 text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unnes-navy text-unnes-gold">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-unnes-navy dark:text-white">
            Space<span className="text-unnes-blue dark:text-unnes-gold">Hub</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            aria-label="Muat ulang"
            className="rounded-lg border border-unnes-border p-1.5 text-slate-600 dark:border-unnes-border-dark dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah tema"
            className="rounded-lg border border-unnes-border p-1.5 text-slate-600 dark:border-unnes-border-dark dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg border border-unnes-border p-1.5 text-slate-600 dark:border-unnes-border-dark dark:text-slate-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav
        aria-label="Navigasi mobile"
        className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-0.5"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentNav === id;
          const badge = getBadge(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-unnes-navy text-white dark:bg-unnes-gold dark:text-unnes-gold-ink'
                  : 'bg-unnes-surface text-slate-600 dark:bg-[#172344] dark:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-unnes-gold text-unnes-gold-ink dark:bg-unnes-navy dark:text-white'
                      : 'bg-unnes-navy/10 text-unnes-navy dark:bg-white/10 dark:text-unnes-gold'
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
