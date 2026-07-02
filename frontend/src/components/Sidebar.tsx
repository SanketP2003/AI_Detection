import { LayoutDashboard, BarChart2, Shield, History, Settings, HelpCircle, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
      ${isActive 
        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-md shadow-neutral-900/10' 
        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 hover:text-neutral-900 dark:hover:text-white'}
    `}
  >
    <Icon className="w-5 h-5" />
    {label}
  </NavLink>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="w-64 border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col h-screen sticky top-0 bg-white dark:bg-neutral-950 transition-colors duration-300">
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Header/Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center shadow-md shadow-neutral-900/10">
              <Shield className="w-5 h-5 text-white dark:text-neutral-900" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm leading-tight text-neutral-900 dark:text-white">Guardian Console</h1>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-extrabold">Enterprise Tier</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarLink to="/detection" icon={BarChart2} label="Detector" />
            <SidebarLink to="/advisor" icon={Shield} label="Advisor" />
            <SidebarLink to="/history" icon={History} label="History" />
            <SidebarLink to="/settings" icon={Settings} label="Settings" />
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-6">
          {user?.username && (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-3.5 border border-neutral-150 dark:border-neutral-800/40">
              <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Logged in as</p>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-1">{user.username}</p>
              {user.isAdmin && (
                <span className="inline-block text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold mt-1.5">
                  Admin Account
                </span>
              )}
            </div>
          )}

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-550 dark:text-neutral-450 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 hover:text-neutral-900 dark:hover:text-white transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              Help Center
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
