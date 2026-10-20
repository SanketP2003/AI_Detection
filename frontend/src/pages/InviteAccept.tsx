import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPublicInvitation,
  acceptWorkspaceInvitation,
  PublicInvitation,
} from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle2, AlertCircle, Users, ArrowRight, LogIn } from 'lucide-react';

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    let isMounted = true;
    getPublicInvitation(token)
      .then((data) => {
        if (!isMounted) return;
        setInvitation(data);
        if (!data.isValid) {
          setError('This invitation has already been accepted or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Invitation not found or link has expired.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptWorkspaceInvitation(token);
      setAcceptSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
      setAccepting(false);
    }
  };

  const userEmail = user?.email?.trim().toLowerCase();
  const invitedEmail = invitation?.email?.trim().toLowerCase();
  const isEmailMatch = user && userEmail && invitedEmail && userEmail === invitedEmail;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between font-sans selection:bg-emerald-500/20">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-[480px] bg-[var(--surface)] border border-[var(--line)] rounded-[20px] p-8 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--muted)]">
              Loading invitation details…
            </div>
          ) : error && !invitation ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--ink)] font-display">
                Invitation Unavailable
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {error}
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Return to home →
                </Link>
              </div>
            </div>
          ) : invitation ? (
            <div className="space-y-6">
              {/* Eyebrow */}
              <div className="text-center space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Workspace Invitation
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] font-display">
                  Join {invitation.workspaceName}
                </h1>
                <p className="text-xs text-[var(--muted)]">
                  Invited by {invitation.inviterName}
                </p>
              </div>

              {/* Invitation Summary Card */}
              <div className="p-4 rounded-[14px] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Role</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                    {invitation.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Invited Email</span>
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink)]">
                    {invitation.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Expires</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status or Error Notice */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {acceptSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Welcome to {invitation.workspaceName}!
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Redirecting you to your workspace…
                  </p>
                </div>
              ) : !user ? (
                /* Unauthenticated State */
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-center text-[var(--muted)]">
                    Sign in to AI Verify to accept this invitation.
                  </p>
                  <Link
                    to={`/signin?next=${encodeURIComponent(`/invite/${token}`)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Accept</span>
                  </Link>
                  <Link
                    to={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] border border-[var(--line)] hover:bg-[var(--surface-2)] text-[var(--ink)] text-xs font-semibold transition-colors"
                  >
                    <span>Create new account</span>
                  </Link>
                </div>
              ) : isEmailMatch ? (
                /* Authenticated and Email Matches */
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {accepting ? 'Accepting…' : 'Accept Invitation'}
                    {!accepting && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <p className="text-[11px] text-center text-[var(--muted)]">
                    You are signed in as {user.email}
                  </p>
                </div>
              ) : (
                /* Authenticated but Email Mismatch */
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <p className="font-semibold">Email mismatch</p>
                    <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                      This invitation was issued to <span className="font-mono text-[var(--ink)]">{invitation.email}</span>. You are currently signed in as <span className="font-mono text-[var(--ink)]">{user.email || user.username}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full py-2.5 px-4 rounded-[10px] border border-[var(--line)] hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    Sign out to switch accounts
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
