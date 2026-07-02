import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-4 sticky top-0 z-50">
      <nav className="flex items-center justify-between px-8 py-4 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl shadow-lg shadow-neutral-100/50 dark:shadow-none transition-all duration-300">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md shadow-neutral-900/10">
              <Shield className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-white transition-colors flex items-center gap-1.5">
              Guardian
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">v3.0</span>
            </span>
          </Link>
        </motion.div>

        {/* Mid Links */}
        <div className="hidden md:flex items-center gap-2 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
          {[
            { name: 'Product', path: '/product' },
            { name: 'Forensics', path: '/forensics' },
            { name: 'Enterprise', path: '/enterprise' },
            { name: 'Security', path: '/security' },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-full transition-all duration-200 hover:text-neutral-900 dark:hover:text-white relative ${isActive(link.path)
                  ? 'text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-neutral-900/60 shadow-sm border border-neutral-200/20 dark:border-neutral-800/20'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/30'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <Link
            to="/signin"
            className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-md shadow-neutral-900/10 hover:shadow-lg hover:shadow-neutral-900/20 dark:shadow-none"
          >
            Get Started
          </Link>
        </motion.div>

      </nav>
    </div>
  );
}
