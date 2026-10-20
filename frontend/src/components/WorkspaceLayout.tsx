import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import PageTransition from './PageTransition';
import { useTheme } from '../context/ThemeContext';

import TrialBanner from './TrialBanner';

export default function WorkspaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  return (
    <div className={`app ${resolvedTheme}`}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="main">
        <TrialBanner />
        <AppHeader onOpenMobile={() => setMobileOpen(true)} />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}
