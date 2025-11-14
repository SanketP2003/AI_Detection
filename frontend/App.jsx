import React from 'react';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Outlet } from 'react-router-dom';

import Home from './src/pages/Home';
import Detector from './src/pages/Detector';
import Chat from './src/pages/Chat';
import About from './src/pages/About';
import NotFound from './src/pages/NotFound';
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import Admin from './src/pages/Admin';
import Profile from './src/pages/Profile';

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
  return <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />;
}
