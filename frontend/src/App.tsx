import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './context/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import WorkspaceLayout from './components/WorkspaceLayout';
import PageTransition from './components/PageTransition';
import { getPageTitle } from './navigation';

const Landing = lazy(() => import('./pages/Landing'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Detection = lazy(() => import('./pages/Detection'));
const History = lazy(() => import('./pages/History'));
const Reports = lazy(() => import('./pages/Reports'));
const Advisor = lazy(() => import('./pages/Advisor'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const InviteAccept = lazy(() => import('./pages/InviteAccept'));
const NotFound = lazy(() => import('./pages/NotFound'));

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const titleMap: Record<string, string> = {
      '/': 'AI Verify — Content Authenticity & Pattern Analysis',
      '/pricing': 'Pricing & Plans — AI Verify',
      '/dashboard': 'Overview — AI Verify',
      '/detection': 'New Analysis — AI Verify',
      '/history': 'Scan History — AI Verify',
      '/reports': 'Reports — AI Verify',
      '/advisor': 'AI Advisor — AI Verify',
      '/how-it-works': 'How It Works — AI Verify',
      '/forensics': 'How It Works — AI Verify',
      '/settings': 'Settings — AI Verify',
      '/admin': 'Admin Console — AI Verify',
    };

    if (titleMap[pathname]) {
      document.title = titleMap[pathname];
    } else if (pathname.startsWith('/signin')) {
      document.title = 'Sign In — AI Verify';
    } else if (pathname.startsWith('/signup')) {
      document.title = 'Sign Up — AI Verify';
    } else if (pathname.startsWith('/invite/')) {
      document.title = 'Workspace Invitation — AI Verify';
    } else {
      const pageTitle = getPageTitle(pathname, location.search);
      document.title = pageTitle !== 'Workspace' ? `${pageTitle} — AI Verify` : 'Page Not Found — AI Verify';
    }
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <TitleUpdater />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Standalone Landing, Pricing & Auth Routes (Public) */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/invite/:token" element={<InviteAccept />} />
                <Route path="/signin/*" element={<PageTransition><SignIn /></PageTransition>} />
                <Route path="/signup/*" element={<PageTransition><SignUp /></PageTransition>} />

                {/* Workspace Layout Routes (Protected) */}
                <Route
                  element={
                    <ProtectedRoute>
                      <WorkspaceLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/detection" element={<Detection />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/advisor" element={<Advisor />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/forensics" element={<Navigate to="/how-it-works" replace />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/billing" element={<Navigate to="/settings?tab=billing" replace />} />
                  <Route path="/settings/team" element={<Navigate to="/settings?tab=team" replace />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>

                {/* Catch-all 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
