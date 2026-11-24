import { Database } from 'lucide-react';
import { useSpaceHub } from './context/SpaceHubContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Toast from './components/Toast';
import LoginView from './views/LoginView';
import FindView from './views/FindView';
import DetailView from './views/DetailView';
import BookingView from './views/BookingView';
import MyBookingsView from './views/MyBookingsView';
import AdminView from './views/AdminView';
import FloorPlanView from './views/FloorPlanView';
import ScheduleView from './views/ScheduleView';
import CalendarView from './views/CalendarView';
import FavoritesView from './views/FavoritesView';
import NotificationsView from './views/NotificationsView';
import FlowView from './views/FlowView';

export default function App() {
  const { user, isAdmin, activeView, isSupabaseConfigured } = useSpaceHub();

  if (!user) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'find':
        return <FindView />;
      case 'det':
        return <DetailView />;
      case 'bk':
        return <BookingView />;
      case 'mine':
        return isAdmin ? <AdminView /> : <MyBookingsView />;
      case 'admin':
        return isAdmin ? <AdminView /> : <FindView />;
      case 'plan':
        return <FloorPlanView />;
      case 'sched':
        return <ScheduleView />;
      case 'cal':
        return <CalendarView />;
      case 'favs':
        return isAdmin ? <FindView /> : <FavoritesView />;
      case 'notif':
        return isAdmin ? <AdminView /> : <NotificationsView />;
      case 'flow':
        return <FlowView />;
      default:
        return isAdmin ? <AdminView /> : <FindView />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#141923] dark:bg-ink-canvas dark:text-[#EEF2F7] lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        {!isSupabaseConfigured && (
          <div className="border-b border-[#EAECEF] bg-[#F8F9FB] px-4 py-2 text-xs text-[#59647A] dark:border-white/[0.07] dark:bg-ink-card dark:text-[#9AA7BE]">
            <div className="mx-auto flex max-w-6xl items-center gap-2">
              <Database className="h-3.5 w-3.5 flex-none text-unnes-navy dark:text-unnes-gold" />
              <span>
                Mode demo lokal aktif. Isi <code className="font-mono text-[11px]">.env</code> Supabase untuk sinkronisasi
                lintas perangkat.
              </span>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {renderView()}
        </main>
      </div>
      <Toast />
    </div>
  );
}
