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
    <header className="sticky top-0 z-30 bg-unnes-navy text-white dark:border-b dark:border-white/[0.06] dark:bg-ink-rail lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => navigate(isAdmin ? 'admin' : 'find')} className="text-left">
          <span className="text-lg font-extrabold tracking-[-0.03em] text-white">
            Space<span className="text-unnes-gold">Hub</span>
          </span>
          <span className="ml-2 text-xs font-medium text-[#A8BCE2] dark:text-[#7D8DA8]">FEB UNNES</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => refreshData(true)}
            disabled={syncing}
            aria-label="Muat ulang"
            className="rounded-lg p-1.5 text-[#C2D3F2]"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ubah tema"
            className="rounded-lg p-1.5 text-[#C2D3F2]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="rounded-lg p-1.5 text-[#C2D3F2]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav aria-label="Navigasi mobile" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2.5">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = currentNav === id;
          const badge = getBadge(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-unnes-gold font-semibold text-unnes-gold-ink'
                  : 'text-[#C8D7F2] hover:bg-white/10'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && <span className="tabular-nums opacity-80">({badge})</span>}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
