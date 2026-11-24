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
  const { user, activeView, isSupabaseConfigured } = useSpaceHub();

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
        return <MyBookingsView />;
      case 'admin':
        return <AdminView />;
      case 'plan':
        return <FloorPlanView />;
      case 'sched':
        return <ScheduleView />;
      case 'cal':
        return <CalendarView />;
      case 'favs':
        return <FavoritesView />;
      case 'notif':
        return <NotificationsView />;
      case 'flow':
        return <FlowView />;
      default:
        return <FindView />;
    }
  };

  return (
    <div className="min-h-screen bg-unnes-surface text-[#0f1d3d] dark:bg-unnes-surface-dark dark:text-[#e7ecf8] lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        {!isSupabaseConfigured && (
          <div className="border-b border-amber-300/60 bg-amber-50/90 px-4 py-1.5 text-[11px] font-medium text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="mx-auto flex max-w-6xl items-center gap-1.5">
              <Database className="h-3.5 w-3.5 flex-none" />
              <span>
                <strong>Demo Lokal</strong> — isi <code className="font-mono">.env</code> Supabase untuk sinkronisasi
                lintas perangkat.
              </span>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:py-7">
          {renderView()}
        </main>
      </div>
      <Toast />
    </div>
  );
}
