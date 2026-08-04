import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Settings, MapPinned, ShieldCheck,
  Truck, Receipt, ArrowLeft, Menu, X, LogOut, Calendar, Users, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import AdminDashboard from './admin/Dashboard';
import AdminUsersPanel from './admin/UsersPanel';
import AdminCMSPanel from './admin/CMSPanel';
import AdminFSAPanel from './admin/FSAPanel';
import AdminVaccinePanel from './admin/VaccinePanel';
import AdminFleetPanel from './admin/FleetPanel';
import AdminReports from './admin/Reports';
import AdminSchedulePanel from './admin/SchedulePanel';
import AdminBookingsPanel from './admin/BookingsPanel';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview', title: 'Dashboard', subtitle: 'Real-time overview of your operations' },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck, group: 'Operations', title: 'Customer Bookings', subtitle: 'View customer details, addresses, subscription plans & chosen dates' },
  { id: 'users', label: 'Users', icon: Users, group: 'Overview', title: 'Registered Users', subtitle: 'Accounts, profiles, and subscriptions' },
  { id: 'schedule', label: 'Pickup Windows', icon: Calendar, group: 'Operations', title: 'Pickup Windows', subtitle: '60-day calendar & daily operating sessions' },
  { id: 'fsa', label: 'FSA Manager', icon: MapPinned, group: 'Operations', title: 'FSA Manager', subtitle: 'Service zones and coverage' },
  { id: 'vaccines', label: 'Vaccines', icon: ShieldCheck, group: 'Operations', title: 'Vaccine Verification', subtitle: 'Review submitted records' },
  { id: 'fleet', label: 'Fleet', icon: Truck, group: 'Operations', title: 'Fleet', subtitle: 'Vans and availability' },
  { id: 'cms', label: 'CMS', icon: Settings, group: 'Settings', title: 'Content Settings', subtitle: 'Site copy and pricing' },
  { id: 'reports', label: 'Reports', icon: Receipt, group: 'Settings', title: 'Reports', subtitle: 'Revenue and activity' },
];

const groups = ['Overview', 'Operations', 'Settings'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const active = tabs.find(t => t.id === activeTab) ?? tabs[0];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'bookings': return <AdminBookingsPanel />;
      case 'users': return <AdminUsersPanel />;
      case 'schedule': return <AdminSchedulePanel />;
      case 'cms': return <AdminCMSPanel />;
      case 'fsa': return <AdminFSAPanel />;
      case 'vaccines': return <AdminVaccinePanel />;
      case 'fleet': return <AdminFleetPanel />;
      case 'reports': return <AdminReports />;
      default: return <AdminDashboard />;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminName = user?.name || 'Administrator';
  const adminInitials = adminName.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'A';

  return (
    <div className="min-h-screen lg:h-screen bg-dark-900 flex lg:overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 lg:w-64 bg-dark-800/95 backdrop-blur-sm border-r border-dark-600/80 flex flex-col shrink-0 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 border-b border-dark-600/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-6 w-auto" />
            <span className="text-[10px] text-brand-400 uppercase tracking-[0.2em] font-semibold mt-1.5">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {groups.map(group => (
            <div key={group}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-dark-500 uppercase tracking-[0.15em]">{group}</p>
              <div className="space-y-0.5">
                {tabs.filter(t => t.group === group).map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-300 font-medium'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="admin-active-pill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-400"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-dark-400 group-hover:text-dark-200'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin profile + actions */}
        <div className="p-3 border-t border-dark-600/80 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/40 to-brand-600/10 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
              {adminInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-dark-400 truncate">{user?.email || 'Signed in'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-dark-200 rounded-xl hover:bg-dark-700/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-red-300 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3.5 bg-dark-800/80 backdrop-blur-md border-b border-dark-600/80">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1 text-dark-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-display font-bold text-white leading-tight truncate">{active.title}</h1>
            <p className="hidden sm:block text-xs text-dark-400 truncate">{active.subtitle}</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-700/50 border border-dark-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-dark-300">Live</span>
          </div>
        </header>

        <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
