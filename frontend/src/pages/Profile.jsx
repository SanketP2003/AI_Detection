import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  FileText,
  MessageSquare,
  Edit2,
  Save,
  X,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Activity,
  Sparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingDetections, setIsLoadingDetections] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/me`, { credentials: 'include' });
      const data = await res.json();

      if (!data.authenticated) {
        navigate('/login');
        return;
      }

      const profileRes = await fetch(`${API_BASE}/api/user/profile`, { credentials: 'include' });
      const profileData = await profileRes.json();

      setUser(profileData);
      setNewUsername(profileData.username);
      setNewEmail(profileData.email || '');
      setLoading(false);
    } catch (err) {
      console.error('Auth error:', err);
      navigate('/login');
    }
  }, [navigate]);

  const loadChatHistory = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const res = await fetch(`${API_BASE}/api/chats/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  const loadDetectionHistory = useCallback(async () => {
    setIsLoadingDetections(true);
    try {
      const res = await fetch(`${API_BASE}/api/detections/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDetectionHistory(data);
      }
    } catch (err) {
      console.error('Failed to load detection history:', err);
    } finally {
      setIsLoadingDetections(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadDetectionHistory();
    }
  }, [user, loadChatHistory, loadDetectionHistory]);

  const formatDate = (value, includeTime = false) => {
    if (!value) return '—';
    try {
      const date = new Date(value);
      return date.toLocaleString(undefined, includeTime
        ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { month: 'short', day: 'numeric', year: 'numeric' }
      );
    } catch {
      return value;
    }
  };

  const sortedChats = useMemo(() => (
    [...chatHistory].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  ), [chatHistory]);

  const sortedDetections = useMemo(() => (
    [...detectionHistory].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  ), [detectionHistory]);

  const totalChats = chatHistory.length;
  const totalDetections = detectionHistory.length;

  const avgConfidence = useMemo(() => {
    if (!totalDetections) return null;
    const total = detectionHistory.reduce((sum, item) => sum + (Number(item.confidence) || 0), 0);
    return Math.round(total / totalDetections);
  }, [detectionHistory, totalDetections]);

  const aiSignals = useMemo(() => detectionHistory.filter((d) => d.result === 'AI-Generated').length, [detectionHistory]);
  const humanSignals = Math.max(totalDetections - aiSignals, 0);
  const aiPercentage = totalDetections ? Math.round((aiSignals / totalDetections) * 100) : 0;

  const activityTimeline = useMemo(() => {
    const chatEvents = chatHistory.map((chat) => ({
      id: `chat-${chat.id}`,
      type: 'chat',
      label: 'Chat session',
      body: chat.message,
      timestamp: chat.createdAt
    }));

    const detectionEvents = detectionHistory.map((entry) => ({
      id: `det-${entry.id}`,
      type: 'detection',
      label: entry.result || 'Detection',
      body: entry.contentPreview || 'Run recorded',
      timestamp: entry.createdAt
    }));

    return [...chatEvents, ...detectionEvents]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 8);
  }, [chatHistory, detectionHistory]);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      showNotification('error', 'Username cannot be empty');
      return;
    }

    fetch(`${API_BASE}/api/user/profile/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: newUsername })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setUser({ ...user, username: data.username });
          setIsEditingUsername(false);
          showNotification('success', 'Username updated successfully');
        } else {
          showNotification('error', data.error || 'Failed to update username');
        }
      })
      .catch(() => {
        showNotification('error', 'Failed to update username');
      });
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    fetch(`${API_BASE}/api/user/profile/email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: newEmail })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setUser({ ...user, email: data.email });
          setIsEditingEmail(false);
          showNotification('success', 'Email updated successfully');
        } else {
          showNotification('error', data.error || 'Failed to update email');
        }
      })
      .catch(() => {
        showNotification('error', 'Failed to update email');
      });
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showNotification('error', 'Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    fetch(`${API_BASE}/api/user/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setIsEditingPassword(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          showNotification('success', 'Password updated successfully');
        } else {
          showNotification('error', data.error || 'Failed to update password');
        }
      })
      .catch(() => {
        showNotification('error', 'Failed to update password');
      });
  };

  const deleteChatHistory = async (chatId) => {
    fetch(`${API_BASE}/api/chats/${chatId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then((res) => {
        if (res.ok) {
          setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
          showNotification('success', 'Chat deleted successfully');
        } else {
          showNotification('error', 'Failed to delete chat');
        }
      })
      .catch(() => {
        showNotification('error', 'Failed to delete chat');
      });
  };

  const deleteDetectionHistory = async (detectionId) => {
    fetch(`${API_BASE}/api/detections/${detectionId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then((res) => {
        if (res.ok) {
          setDetectionHistory((prev) => prev.filter((d) => d.id !== detectionId));
          showNotification('success', 'Detection deleted successfully');
        } else {
          showNotification('error', 'Failed to delete detection');
        }
      })
      .catch(() => {
        showNotification('error', 'Failed to delete detection');
      });
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Chats logged',
      value: totalChats,
      detail: 'Lifetime conversations',
      icon: MessageSquare,
      accent: 'from-purple-500/30 to-purple-500/5'
    },
    {
      label: 'Detections reviewed',
      value: totalDetections,
      detail: totalDetections ? `Last run ${formatDate(sortedDetections[0]?.createdAt)}` : 'Run your first analysis',
      icon: FileText,
      accent: 'from-blue-500/30 to-blue-500/5'
    },
    {
      label: 'Avg confidence',
      value: avgConfidence !== null ? `${avgConfidence}%` : '—',
      detail: 'Confidence across detections',
      icon: TrendingUp,
      accent: 'from-emerald-500/30 to-emerald-500/5'
    },
    {
      label: 'AI signals',
      value: totalDetections ? `${aiSignals}/${totalDetections}` : '0',
      detail: `${aiPercentage}% AI verdict rate`,
      icon: Shield,
      accent: 'from-pink-500/30 to-pink-500/5'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050507] to-black text-gray-100">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <motion.section
          className="rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-900/20 via-black to-[#0d0f1c] p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 text-xs uppercase tracking-[0.4em] text-gray-300">
                  <Sparkles className="h-3 w-3 text-purple-300" />
                  Active member
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-space font-semibold text-white">
                  {user?.username}
                </h1>
                <p className="text-sm text-gray-400">{user?.email || 'No email on file'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => scrollToSection('account-settings')}
                  className="px-5 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/40 transition"
                >
                  Update profile
                </button>
                <button
                  onClick={() => scrollToSection('activity')}
                  className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-100 transition"
                >
                  Review activity
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Chats</p>
                <p className="text-3xl font-bold text-white mt-2">{totalChats}</p>
                <p className="text-xs text-gray-400 mt-1">Lifetime conversations</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Detections</p>
                <p className="text-3xl font-bold text-white mt-2">{totalDetections}</p>
                <p className="text-xs text-gray-400 mt-1">Reports generated</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Confidence</p>
                <p className="text-3xl font-bold text-white mt-2">{avgConfidence !== null ? `${avgConfidence}%` : '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Average verdict confidence</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <motion.div
              key={metric.label}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${metric.accent} p-5 backdrop-blur-sm`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <metric.icon className="h-5 w-5 text-white/80" />
              <p className="text-xs uppercase tracking-[0.3em] text-gray-300 mt-3">{metric.label}</p>
              <p className="text-3xl font-space font-semibold text-white mt-2">{metric.value}</p>
              <p className="text-sm text-gray-300 mt-1">{metric.detail}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2" id="account-settings">
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Identity</p>
                <h2 className="text-xl font-semibold text-white">Account details</h2>
              </div>
              <button
                onClick={loadChatHistory}
                className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gray-300"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingChats ? 'animate-spin text-purple-300' : ''}`} />
                Sync
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <User className="h-4 w-4" /> Username
                  </div>
                  {!isEditingUsername && (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-purple-300 hover:text-purple-200 text-sm flex items-center gap-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditingUsername ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter new username"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateUsername}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-2 text-sm font-semibold"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(user.username);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm text-gray-300"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-white">{user?.username}</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Mail className="h-4 w-4" /> Email
                  </div>
                  {!isEditingEmail && (
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-purple-300 hover:text-purple-200 text-sm flex items-center gap-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditingEmail ? (
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter new email"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateEmail}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-2 text-sm font-semibold"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingEmail(false);
                          setNewEmail(user.email || '');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm text-gray-300"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-white">{user?.email || 'No email set'}</p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security</p>
                <h2 className="text-xl font-semibold text-white">Password & access</h2>
              </div>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="text-purple-300 hover:text-purple-200 text-sm flex items-center gap-1"
                >
                  <Lock className="h-4 w-4" />
                  Change
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="New password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new password"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdatePassword}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 py-2 text-sm font-semibold"
                  >
                    <Save className="h-4 w-4" /> Update password
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm text-gray-300"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-gray-300">
                  Password last updated <span className="text-white font-semibold">recently</span>. You can rotate credentials any time for enhanced security.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">Session safety</p>
              <p>Keep MFA enabled on your account. We never store your passwords—only salted hashes behind zero-trust gateways.</p>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]" id="insights">
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">Activity stream</p>
                <h2 className="text-xl font-semibold text-white">Recent timeline</h2>
              </div>
              <button
                onClick={() => {
                  loadChatHistory();
                  loadDetectionHistory();
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gray-300"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingChats || isLoadingDetections ? 'animate-spin text-purple-300' : ''}`} />
                Refresh
              </button>
            </div>
            {activityTimeline.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Your interactions will appear here once you start chatting or running detections.
              </div>
            ) : (
              <ol className="space-y-5">
                {activityTimeline.map((event, index) => (
                  <li key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-3 w-3 rounded-full ${event.type === 'chat' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      {index !== activityTimeline.length - 1 && (
                        <span className="flex-1 w-px bg-white/10 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span className="font-semibold text-white">{event.label}</span>
                        <span className="text-xs text-gray-400">{formatDate(event.timestamp, true)}</span>
                      </div>
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">{event.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Detection insights</p>
                <h2 className="text-xl font-semibold text-white">Signal health</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">AI-generated</span>
                <span className="text-white font-semibold">{aiSignals}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${aiPercentage}%` }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Human-authored</span>
                <span className="text-white font-semibold">{humanSignals}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Activity className="h-4 w-4" /> Latest detection
              </div>
              {sortedDetections.length ? (
                <>
                  <p className="text-base text-white line-clamp-2">{sortedDetections[0].contentPreview}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(sortedDetections[0].createdAt, true)}
                  </div>
                </>
              ) : (
                <p>No detections recorded yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare className="h-4 w-4" /> Latest conversation
              </div>
              {sortedChats.length ? (
                <>
                  <p className="text-base text-white line-clamp-2">{sortedChats[0].message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(sortedChats[0].createdAt, true)}
                  </div>
                </>
              ) : (
                <p>No chats logged yet.</p>
              )}
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2" id="activity">
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Conversations</p>
                <h2 className="text-xl font-semibold text-white">Chat archive</h2>
              </div>
              <button
                onClick={loadChatHistory}
                disabled={isLoadingChats}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gray-300"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingChats ? 'animate-spin text-purple-300' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoadingChats ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader className="h-6 w-6 text-white animate-spin" />
              </div>
            ) : sortedChats.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
                No chat history yet. Start a conversation with the advisor.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[420px]">
                {sortedChats.map((chat) => (
                  <div key={chat.id} className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/30">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-medium text-sm line-clamp-2">{chat.message}</p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(chat.createdAt, true)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteChatHistory(chat.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {chat.response && (
                      <p className="mt-3 text-sm text-gray-300 line-clamp-3">{chat.response}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Detection ledger</p>
                <h2 className="text-xl font-semibold text-white">Reports & verdicts</h2>
              </div>
              <button
                onClick={loadDetectionHistory}
                disabled={isLoadingDetections}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gray-300"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingDetections ? 'animate-spin text-purple-300' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoadingDetections ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader className="h-6 w-6 text-white animate-spin" />
              </div>
            ) : sortedDetections.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-gray-500 text-sm">
                No detection history yet. Run your first analysis to see results here.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[420px]">
                {sortedDetections.map((detection) => (
                  <div key={detection.id} className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${
                            detection.result === 'AI-Generated'
                              ? 'bg-red-500/10 text-red-300 border-red-500/40'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {detection.result || 'Detection'}
                          </span>
                          {typeof detection.confidence !== 'undefined' && (
                            <span className="px-3 py-1 rounded-full border border-white/10 text-white/80">
                              {detection.confidence}% confidence
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white line-clamp-2">{detection.contentPreview}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(detection.createdAt, true)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDetectionHistory(detection.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {notification.show && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur text-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-500/10 border-red-500/40 text-red-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

