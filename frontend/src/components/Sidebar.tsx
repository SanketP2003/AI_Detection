import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Bot,
  HelpCircle,
  Settings,
  CreditCard,
  ShieldCheck,
  Users,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient, getWorkspaces, switchWorkspace, Workspace } from '../api/client';
import { NAV_GROUPS, isNavItemActive, NavItem } from '../navigation';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

type ServiceHealthStatus = 'checking' | 'operational' | 'degraded' | 'offline';

function getNavIcon(path: string) {
  if (path.startsWith('/settings?tab=billing')) {
    return CreditCard;
  }
  if (path.startsWith('/settings?tab=team')) {
    return Users;
  }
  switch (path) {
    case '/dashboard':
      return LayoutDashboard;
    case '/detection':
      return PlusCircle;
    case '/history':
      return History;
    case '/reports':
      return FileText;
    case '/advisor':
      return Bot;
    case '/how-it-works':
      return HelpCircle;
    case '/settings':
      return Settings;
    case '/admin':
      return ShieldCheck;
    default:
      return LayoutDashboard;
  }
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [status, setStatus] = useState<ServiceHealthStatus>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getWorkspaces()
      .then((data) => {
        if (!isMounted) return;
        setWorkspaces(data);
        const def = data.find((w) => w.isDefault) || data[0];
        if (def) setActiveWorkspaceId(def.id);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSwitchWorkspace = async (id: number) => {
    try {
      setActiveWorkspaceId(id);
      await switchWorkspace(id);
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/actuator/health', { timeout: 5000 });
        if (!isMounted) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastChecked(`Last checked ${now}`);
        if (res.status === 200 && (res.data?.status === 'UP' || res.data === 'UP')) {
          setStatus('operational');
        } else {
          setStatus('degraded');
        }
      } catch {
        if (!isMounted) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastChecked(`Last checked ${now}`);
        setStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'open' : ''} bg-white dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-850/80 select-none`}
      aria-label="Sidebar navigation"
    >
      <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto no-scrollbar">
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between pb-5 pt-2 border-b border-neutral-100 dark:border-neutral-850/80 mb-5">
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className="flex items-center gap-3 text-inherit no-underline"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center p-1.5 shadow-sm flex-shrink-0">
                <img src="/logo.png" alt="AI Verify" className="w-7 h-7 object-contain" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-display font-extrabold text-sm tracking-tight text-neutral-900 dark:text-white leading-tight">
                  AI Verify
                </h1>
                <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                  Authenticity Suite
                </p>
              </div>
            </NavLink>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="min-[901px]:hidden p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {group.label}
                </p>
                {group.items
                  .filter(
                    (item: NavItem) =>
                      !item.adminOnly ||
                      user?.isAdmin ||
                      user?.roles?.includes('ADMIN') ||
                      user?.roles?.includes('ROLE_ADMIN')
                  )
                  .map((item: NavItem) => {
                    const Icon = getNavIcon(item.path);
                    const isActive = isNavItemActive(location.pathname, item, location.search);

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                        ${
                          isActive
                            ? 'bg-neutral-900 text-white dark:bg-emerald-600/90 dark:text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-950 dark:hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info: Status pill, Account details & Sign out */}
        <div className="pt-5 border-t border-neutral-100 dark:border-neutral-850/80 space-y-3 mt-6">
          {/* Service health indicator */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/40">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                status === 'operational'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : status === 'degraded'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : status === 'offline'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : 'bg-neutral-400 animate-pulse'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  {status === 'operational'
                    ? 'Operational'
                    : status === 'degraded'
                    ? 'Degraded'
                    : status === 'offline'
                    ? 'Offline'
                    : 'Checking…'}
                </span>
                <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500 truncate ml-1">
                  {lastChecked || 'Checking status…'}
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Switcher */}
          {user && workspaces.length > 0 && (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-2.5 border border-neutral-200/50 dark:border-neutral-800/40 space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  Workspace
                </span>
                <NavLink
                  to="/settings?tab=team"
                  onClick={onClose}
                  className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Manage →
                </NavLink>
              </div>
              <select
                aria-label="Select active workspace"
                value={activeWorkspaceId ?? ''}
                onChange={(e) => handleSwitchWorkspace(Number(e.target.value))}
                className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account info */}
          {user?.username ? (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-3 border border-neutral-200/50 dark:border-neutral-800/40">
              <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                Account
              </p>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                {user.username}
              </p>
              {user.isAdmin && (
                <span className="inline-block mt-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-3 border border-neutral-200/50 dark:border-neutral-800/40 flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Guest mode</span>
              <NavLink
                to="/signin"
                onClick={onClose}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign in →
              </NavLink>
            </div>
          )}

          {/* Action button */}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border border-rose-200/60 dark:border-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <NavLink
              to="/signin"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-600/20"
            >
              <span>Sign In to Save</span>
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  );
}
