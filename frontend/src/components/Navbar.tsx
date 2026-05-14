import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Navbar() {

  return (
    <nav className="flex items-center justify-between px-10 py-6 border-b border-neutral-100 dark:border-neutral-800/50 sticky top-0 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl z-50 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors">
            <Shield className="w-4 h-4 text-white dark:text-neutral-900" />
          </div>
          <span className="font-display text-xl font-bold tracking-tighter text-neutral-900 dark:text-white transition-colors">Guardian</span>
        </Link>
      </motion.div>
      <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
        <Link to="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Product</Link>
        <Link to="/forensics" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Forensics</Link>
        <Link to="/enterprise" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Enterprise</Link>
        <Link to="/security" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Security</Link>
      </div>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <Link to="/signin" className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Sign In</Link>
        <Link to="/signup" className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-neutral-200 dark:shadow-none">
          Get Started
        </Link>
      </motion.div>
    </nav>
  );
}
