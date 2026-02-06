import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { login } from '../api/client';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Basic validation before submitting
    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const userInfo = await login({ username: trimmedUsername, password });

      if (userInfo?.isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-20">
        <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Sign in</h1>

          {errorMsg && (
            <div className="mb-4 text-sm text-red-400 bg-red-400/10 p-3 rounded">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Username</label>
              <input
                type="text"
                className="w-full p-3 rounded bg-black/50 border border-white/20 focus:border-white/40 outline-none transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block mb-2">Password</label>
              <input
                type="password"
                className="w-full p-3 rounded bg-black/50 border border-white/20 focus:border-white/40 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-400">
            Don't have an account? <a className="underline hover:text-white" href="/register">Create one</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;
