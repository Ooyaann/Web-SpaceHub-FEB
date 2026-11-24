import { LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-unnes-navy/80 bg-unnes-navy text-white dark:border-unnes-night-line dark:bg-unnes-night-rail lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => navigate(isAdmin ? 'admin' : 'find')} className="text-left">
          <span className="text-lg font-extrabold tracking-[-0.03em] text-white">
            Space<span className="text-unnes-gold">Hub</span>
          </span>
          <span className="ml-2 text-[10px] font-semibold tracking-wider text-[#9BB2DF]">FEB UNNES</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            aria-label="Muat ulang"
            className="rounded-lg border border-white/15 p-1.5 text-[#C7D7F5]"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah tema"
            className="rounded-lg border border-white/15 p-1.5 text-[#C7D7F5]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg border border-white/15 p-1.5 text-[#C7D7F5]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav aria-label="Navigasi mobile" className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2.5">
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
                  ? 'bg-unnes-gold font-bold text-unnes-gold-ink'
                  : 'bg-white/10 text-[#DCE7FA]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && (
                <span
                  className={`rounded px-1 font-mono text-[10px] font-bold ${
                    isActive ? 'bg-unnes-navy text-white' : 'bg-white/15 text-unnes-gold'
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
