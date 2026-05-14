import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/50 dark:border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center transition-colors">
                <Shield className="w-4 h-4 text-white dark:text-neutral-900" />
              </div>
              <span className="font-display text-xl font-bold tracking-tighter text-neutral-900 dark:text-white transition-colors">Guardian</span>
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              The enterprise standard for content authenticity.
            </p>
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/forensics" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Forensics</Link></li>
              <li><Link to="/advisor" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Advisor</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/enterprise" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Enterprise</Link></li>
              <li><Link to="/security" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-neutral-200/50 dark:border-neutral-800/50 text-center text-sm text-neutral-500 dark:text-neutral-400">
          &copy; {new Date().getFullYear()} Guardian. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
