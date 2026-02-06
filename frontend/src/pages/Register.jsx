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

  // Client-side validation
  function validateForm() {
    // Username validation: 3-50 chars, alphanumeric/underscore/hyphen only
    if (!username || username.length < 3 || username.length > 50) {
      return 'Username must be between 3 and 50 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    // Password validation: 8-100 chars
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password.length > 100) {
      return 'Password must not exceed 100 characters';
    }

    // Email validation (only if provided)
    if (email && !/^[A-Za-z0-9+_.-]+@(.+)$/.test(email)) {
      return 'Invalid email format';
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate before submitting
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await registerUser({ username, password, email: email || null });
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
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_-]+$"
                title="3-50 characters, letters, numbers, underscores, hyphens only"
                autoComplete="username"
              />
              <p className="text-xs text-gray-400 mt-1">3-50 characters, letters, numbers, underscores, hyphens only</p>
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
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
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
