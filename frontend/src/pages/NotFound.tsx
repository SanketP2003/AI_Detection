import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-md glass-card p-8 sm:p-10 text-center border border-[var(--line)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)]">
            <FileQuestion className="w-6 h-6" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">
            404 — Not Found
          </span>

          <h1 className="font-['Manrope'] text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] mt-2 mb-3">
            Page not found
          </h1>

          <p className="text-sm leading-relaxed text-[var(--muted)] mb-8">
            The page you are looking for does not exist or has been moved to another location.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--green)] hover:opacity-90 text-white font-['DM_Sans'] text-xs font-bold px-5 py-2.5 rounded-[var(--radius-sm)] transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Workspace
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] px-4 py-2.5 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
