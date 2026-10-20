import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/80 dark:border-neutral-800 bg-white/40 dark:bg-black/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-lg flex items-center justify-center p-1 transition-colors shadow-sm">
                <img src="/logo.png" alt="AI Verify" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white transition-colors">
                AI Verify
              </span>
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
              Enterprise standard for automated content forensics, linguistic entropy modeling, and style authenticity.
            </p>
          </div>

          <div className="text-xs">
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4">
              Workspace
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/detection" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  New Analysis
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Overview Console
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Scan History & Reports
                </Link>
              </li>
              <li>
                <Link to="/advisor" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  AI Forensic Advisor
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-xs">
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4">
              Platform & Tech
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/how-it-works" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Methodology & Forensics
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Pricing & Plans
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-xs">
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4">
              Account & Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/signin" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Settings & Preferences
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <p>&copy; {new Date().getFullYear()} AI Verify. All rights reserved.</p>
          <p className="text-[11px]">Empirical content authenticity verification powered by linguistic stylometry.</p>
        </div>
      </div>
    </footer>
  );
}
