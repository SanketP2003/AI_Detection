import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(username, email, password);
      navigate('/dashboard', { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center shadow-lg shadow-neutral-200 hover:scale-105 transition-transform">
            <Shield className="w-6 h-6 text-white" />
          </Link>
        </div>
        <h2 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-neutral-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-2xl shadow-neutral-200/50 sm:rounded-3xl sm:px-6 border border-neutral-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none transition focus:border-neutral-900"
                placeholder="yourname"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none transition focus:border-neutral-900"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none transition focus:border-neutral-900"
                placeholder="At least 8 characters"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-neutral-500">
            Already have an account? <Link to="/signin" className="font-medium text-neutral-900">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
