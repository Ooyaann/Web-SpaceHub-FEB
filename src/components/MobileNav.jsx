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
    <header className="sticky top-0 z-30 bg-unnes-navy text-white shadow-md dark:bg-unnes-navy-deep lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('find')}
          className="flex items-center gap-2 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unnes-gold text-unnes-gold-ink">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight">
            Space<span className="text-unnes-gold">Hub</span>
            <span className="ml-1.5 text-[10px] font-semibold text-blue-200/80">FEB UNNES</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            aria-label="Muat ulang data"
            className="rounded-lg bg-white/10 p-2 text-blue-100 transition hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah mode terang atau gelap"
            className="rounded-lg bg-white/10 p-2 text-blue-100 transition hover:bg-white/20"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg bg-white/10 p-2 text-blue-100 transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav
        aria-label="Navigasi mobile"
        className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2"
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
                  ? 'bg-unnes-gold font-extrabold text-unnes-gold-ink'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive ? 'bg-unnes-navy text-white' : 'bg-unnes-gold text-unnes-gold-ink'
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
