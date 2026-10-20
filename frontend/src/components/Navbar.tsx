import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sticky top-0 z-50">
      <nav className="flex items-center justify-between px-5 sm:px-8 py-3.5 sm:py-4 rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl shadow-lg shadow-neutral-900/5 dark:shadow-none transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm p-1">
              <img
                src="/logo.png"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.svg'; }}
                alt="AI Verify"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white transition-colors flex items-center gap-1.5">
              AI Verify
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                v3.0
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop Mid Links */}
        <div className="hidden md:flex items-center gap-1 text-[13px] font-semibold text-neutral-600 dark:text-neutral-400">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-1.5 rounded-full transition-all duration-150 hover:text-neutral-900 dark:hover:text-white ${
                isActive(link.path)
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 font-bold border border-emerald-200/60 dark:border-emerald-800/40'
                  : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/signin"
            className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden mt-2 p-5 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl shadow-2xl flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(link.path)
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col gap-2.5">
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
