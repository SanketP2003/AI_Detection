import { LayoutDashboard, BarChart2, Shield, History, Settings, HelpCircle, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
      ${isActive ? 'bg-blue-50 text-blue-600' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}
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
    <aside className="w-64 border-r border-neutral-100 flex flex-col h-screen sticky top-0 bg-white">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm leading-tight text-neutral-900 border-b border-transparent">Guardian Console</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Enterprise Tier</p>
          </div>
        </div>

        <nav className="space-y-1">
          <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/detection" icon={BarChart2} label="Detector" />
          <SidebarLink to="/advisor" icon={Shield} label="Advisor" />
          <SidebarLink to="/history" icon={History} label="History" />
          <SidebarLink to="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <button className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-xs font-semibold hover:bg-neutral-50 transition-colors">
            Upgrade Plan
          </button>
        </div>

        {user?.username && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-900">Logged in as</p>
            <p className="text-xs text-blue-700 truncate">{user.username}</p>
            {user.isAdmin && (
              <p className="text-xs text-blue-600 font-semibold mt-1">Admin User</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            <HelpCircle className="w-5 h-5" />
            Help Center
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
