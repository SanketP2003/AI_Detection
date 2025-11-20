import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import LoadingScreen from './src/components/LoadingScreen';

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'detector', element: <Detector /> },
      { path: 'chat', element: <Chat /> },
      { path: 'about', element: <About /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'admin', element: <Admin /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <NotFound /> }
    ]
  }
]);

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
