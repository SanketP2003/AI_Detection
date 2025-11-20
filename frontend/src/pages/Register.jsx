import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { registerUser } from '../api/client';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await registerUser({ username, password, email });
      setSuccess('Registration successful! You can now sign in.');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-20">
        <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Create account</h1>
          {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
          {success && <div className="mb-4 text-sm text-green-400">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Username</label>
              <input
                type="text"
                className="w-full p-3 rounded bg-black/50 border border-white/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block mb-2">Email (optional)</label>
              <input
                type="email"
                className="w-full p-3 rounded bg-black/50 border border-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block mb-2">Password</label>
              <input
                type="password"
                className="w-full p-3 rounded bg-black/50 border border-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-400">
            Already have an account? <a className="underline" href="/login">Sign in</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
