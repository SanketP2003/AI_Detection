import { Menu, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPageTitle } from '../navigation';
import ThemeToggle from './ThemeToggle';

interface AppHeaderProps {
  onOpenMobile: () => void;
}

export default function AppHeader({ onOpenMobile }: AppHeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const currentPage = getPageTitle(location.pathname, location.search);

  // Compute initials - default to 'SP' if user name matches Sanket or test analyst
  let initials = 'SP';
  if (user?.fullName) {
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = user.fullName.slice(0, 2).toUpperCase();
    }
  } else if (user?.username && !user.username.startsWith('user_')) {
    const parts = user.username.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = user.username.slice(0, 2).toUpperCase();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#161916]/80 backdrop-blur-md px-6 sm:px-10 py-4 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger + Clean Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            aria-label="Open navigation"
            title="Open navigation"
            className="min-[901px]:hidden p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">AI Verify</span>
            <span>/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">{currentPage}</span>
          </div>
        </div>

        {/* Right: ThemeToggle and user avatar circle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div
            className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs flex-shrink-0"
            title={user?.username ? `Logged in as ${user.username}` : 'Sanket'}
            aria-label={user?.username ? `Logged in as ${user.username}` : 'Sanket'}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
