import React, { useState, useEffect } from 'react';
import { Menu, X, Bot, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMe, logout } from '../api/client';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [me, setMe] = useState({ authenticated: false, isAdmin: false, username: '' });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await getMe();
        if (!cancelled) setMe(info);
      } catch {
        if (!cancelled) setMe({ authenticated: false });
      }
    })();
    return () => { cancelled = true };
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'AI Detector', href: '/detector' },
    { name: 'Chat Advisor', href: '/chat' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-carbon/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <motion.div
            className="flex items-center space-x-2 md:space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-carbon border border-white/10 shadow-inner shadow-black/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accentMuted/10 opacity-70"></div>
              <Shield className="h-6 w-6 text-accent relative" />
            </div>
            <Link to="/" className="text-lg md:text-xl font-space font-semibold text-white tracking-wide">
              AI <span className="text-accent">Guardian</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Link
                  to={item.href}
                  className={`px-3 lg:px-4 py-2 text-sm lg:text-base font-inter font-medium rounded-xl border border-transparent transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-white border-white/20 bg-white/5 backdrop-blur'
                      : 'text-mist hover:text-white hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            {/* Admin link (desktop) */}
            {me?.authenticated && me?.isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: navigation.length * 0.1 }}
              >
                <Link
                  to="/admin"
                  className={`px-3 lg:px-4 py-2 text-sm lg:text-base font-inter font-medium rounded-xl border border-transparent transition-all duration-300 ${
                    isActive('/admin') ? 'text-white border-white/20 bg-white/5 backdrop-blur' : 'text-mist hover:text-white hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  Admin
                </Link>
              </motion.div>
            )}
            <div className="flex items-center gap-2 lg:gap-3 ml-4 border-l border-purple-primary/20 pl-4">
              {me?.authenticated ? (
                <>
                  <Link
                    to="/profile"
                    className={`px-3 lg:px-4 py-2 text-sm lg:text-base font-inter font-medium rounded-xl border border-transparent transition-all duration-300 ${
                      isActive('/profile') 
                        ? 'text-white border-white/20 bg-white/5 backdrop-blur' 
                        : 'text-mist hover:text-white hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    Profile
                  </Link>
                  <span className="text-gray-secondary text-xs lg:text-sm font-inter hidden lg:block">Hi, {me.username}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 lg:px-4 py-2 text-sm lg:text-base font-space font-semibold bg-gradient-purple text-white rounded-lg hover:shadow-lg hover:shadow-purple-primary/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 lg:px-4 py-2 text-sm lg:text-base font-inter font-medium text-gray-text hover:text-white transition-colors duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 lg:px-4 py-2 text-sm lg:text-base font-space font-semibold bg-gradient-purple text-white rounded-lg hover:shadow-lg hover:shadow-purple-primary/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-text hover:text-white p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-carbon/95 border border-white/5 rounded-2xl mt-2 shadow-2xl"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-inter font-medium rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'text-white bg-white/10 border border-white/20'
                        : 'text-mist hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Admin link (mobile) */}
                {me?.authenticated && me?.isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-inter font-medium rounded-xl transition-all duration-300 ${
                      isActive('/admin') ? 'text-white bg-white/10 border border-white/20' : 'text-mist hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
                {/* Profile link (mobile) */}
                {me?.authenticated && (
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-inter font-medium rounded-xl transition-all duration-300 ${
                      isActive('/profile') ? 'text-white bg-white/10 border border-white/20' : 'text-mist hover:text-white hover:bg-white/5'
                    }`}
                  >
                    My Profile
                  </Link>
                )}
                <div className="border-t border-purple-primary/20 mt-2 pt-2">
                  {me?.authenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-secondary font-inter">Logged in as <span className="text-purple-primary font-semibold">{me.username}</span></div>
                      <button
                        onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                        className="block w-full text-left px-4 py-3 text-base font-inter font-medium text-gray-text hover:text-white hover:bg-purple-primary/10 rounded-lg transition-all duration-300"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-base font-inter font-medium text-gray-text hover:text-white hover:bg-purple-primary/10 rounded-lg transition-all duration-300"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="block mx-2 mt-2 px-4 py-3 text-base font-space font-semibold text-center bg-gradient-purple text-white rounded-lg hover:shadow-lg hover:shadow-purple-primary/50 transition-all duration-300"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;