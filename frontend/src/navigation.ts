export interface NavItem {
  name: string;
  path: string;
  icon: string;
  aliases?: string[];
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', path: '/dashboard', icon: '⌂' },
      { name: 'New Analysis', path: '/detection', icon: '＋' },
      { name: 'Scan History', path: '/history', icon: '◷' },
      { name: 'Reports', path: '/reports', icon: '▤' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'AI Advisor', path: '/advisor', icon: '✦' },
      {
        name: 'How It Works',
        path: '/how-it-works',
        icon: '?',
        aliases: ['/forensics'],
      },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { name: 'Settings', path: '/settings', icon: '⚙' },
      {
        name: 'Plans & billing',
        path: '/settings?tab=billing',
        icon: '💳',
        aliases: ['/settings/billing'],
      },
      {
        name: 'Team & members',
        path: '/settings?tab=team',
        icon: '👥',
        aliases: ['/settings/team'],
      },
      {
        name: 'Admin',
        path: '/admin',
        icon: '🛡',
        adminOnly: true,
      },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem, search?: string): boolean {
  if (item.path.includes('?')) {
    const fullPath = search ? `${pathname}${search}` : pathname;
    if (fullPath === item.path) return true;
    if (item.aliases && item.aliases.includes(pathname)) return true;
    return false;
  }

  // If on /settings with a tab, plain /settings is not active
  if (item.path === '/settings' && search && (search.includes('tab=billing') || search.includes('tab=team'))) {
    return false;
  }

  if (pathname === item.path) {
    return true;
  }
  if (item.aliases && item.aliases.includes(pathname)) {
    return true;
  }
  return false;
}

export function getPageTitle(pathname: string, search?: string): string {
  if (pathname === '/admin') return 'Admin';
  if (pathname === '/pricing') return 'Pricing';
  if (pathname === '/settings' && search && search.includes('tab=billing')) return 'Plans & billing';
  if (pathname === '/settings' && search && search.includes('tab=team')) return 'Team & members';

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(pathname, item, search)) {
        return item.name;
      }
    }
  }
  return 'Workspace';
}
