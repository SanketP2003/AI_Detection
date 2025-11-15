import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Outlet } from 'react-router-dom';

// Switch to lazy-loaded routes for code splitting
const Home = lazy(() => import('./src/pages/Home'));
const Detector = lazy(() => import('./src/pages/Detector'));
const Chat = lazy(() => import('./src/pages/Chat'));
const About = lazy(() => import('./src/pages/About'));
const NotFound = lazy(() => import('./src/pages/NotFound'));
const Login = lazy(() => import('./src/pages/Login'));
const Register = lazy(() => import('./src/pages/Register'));
const Admin = lazy(() => import('./src/pages/Admin'));
const Profile = lazy(() => import('./src/pages/Profile'));

function Root() {
  return (
    <main className="min-h-screen font-inter">
      <Outlet />
    </main>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Root />}>
      <Route index element={<Home />} />
      <Route path="detector" element={<Detector />} />
      <Route path="chat" element={<Chat />} />
      <Route path="about" element={<About />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="admin" element={<Admin />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-mist">
          <div className="animate-pulse text-sm">Loading…</div>
        </div>
      }
    >
      <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
    </Suspense>
  );
}
