/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './context/ProtectedRoute';
import PageLoader from './components/PageLoader';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Advisor = lazy(() => import('./pages/Advisor'));
const Detection = lazy(() => import('./pages/Detection'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Forensics = lazy(() => import('./pages/Forensics'));
const Enterprise = lazy(() => import('./pages/Enterprise'));
const Security = lazy(() => import('./pages/Security'));

export default function App() {
  return (
    <AuthProvider>
      <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forensics" element={<Forensics />} />
              <Route path="/enterprise" element={<Enterprise />} />
              <Route path="/security" element={<Security />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advisor"
                element={
                  <ProtectedRoute>
                    <Advisor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/detection"
                element={
                  <ProtectedRoute>
                    <Detection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
  );
}
