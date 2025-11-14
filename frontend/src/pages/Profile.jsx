import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  History,
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
  RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [chatHistory, setChatHistory] = useState([]);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingDetections, setIsLoadingDetections] = useState(false);

  // Edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification states
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'chats' && chatHistory.length === 0) {
      loadChatHistory();
    } else if (activeTab === 'detections' && detectionHistory.length === 0) {
      loadDetectionHistory();
    }
  }, [activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/me`, { credentials: 'include' });
      const data = await res.json();

      if (!data.authenticated) {
        navigate('/login');
        return;
      }

      // Load full profile
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
  };

  const loadChatHistory = async () => {
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
  };

  const loadDetectionHistory = async () => {
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
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      showNotification('error', 'Username cannot be empty');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/user/profile/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: newUsername })
      });

      const data = await res.json();

      if (res.ok) {
        setUser({ ...user, username: data.username });
        setIsEditingUsername(false);
        showNotification('success', 'Username updated successfully!');
      } else {
        showNotification('error', data.error || 'Failed to update username');
      }
    } catch (err) {
      showNotification('error', 'Failed to update username');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/user/profile/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail })
      });

      const data = await res.json();

      if (res.ok) {
        setUser({ ...user, email: data.email });
        setIsEditingEmail(false);
        showNotification('success', 'Email updated successfully!');
      } else {
        showNotification('error', data.error || 'Failed to update email');
      }
    } catch (err) {
      showNotification('error', 'Failed to update email');
    }
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

    try {
      const res = await fetch(`${API_BASE}/api/user/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showNotification('success', 'Password updated successfully!');
      } else {
        showNotification('error', data.error || 'Failed to update password');
      }
    } catch (err) {
      showNotification('error', 'Failed to update password');
    }
  };

  const deleteChatHistory = async (chatId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/${chatId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        showNotification('success', 'Chat deleted successfully!');
      }
    } catch (err) {
      showNotification('error', 'Failed to delete chat');
    }
  };

  const deleteDetectionHistory = async (detectionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/detections/${detectionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setDetectionHistory(prev => prev.filter(d => d.id !== detectionId));
        showNotification('success', 'Detection deleted successfully!');
      }
    } catch (err) {
      showNotification('error', 'Failed to delete detection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <Loader className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'chats', label: 'Chat History', icon: MessageSquare },
    { id: 'detections', label: 'Detection History', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <Header />

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              {user?.username}'s Profile
            </h1>

            <p className="text-xl text-gray-400">
              Manage your account settings and view your activity
            </p>
          </motion.div>

          {/* Notification */}
          <AnimatePresence>
            {notification.show && (
              <motion.div
                className="fixed top-24 right-4 z-50 max-w-md"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
              >
                <div className={`p-4 rounded-lg shadow-lg backdrop-blur-sm border flex items-center gap-3 ${
                  notification.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{notification.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-400" />
                  Account Information
                </h2>

                {/* Username */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-400 font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </label>
                    {!isEditingUsername && (
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
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
                        className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new username"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateUsername}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingUsername(false);
                            setNewUsername(user.username);
                          }}
                          className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white text-lg font-semibold">{user?.username}</p>
                  )}
                </div>

                {/* Email */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-400 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </label>
                    {!isEditingEmail && (
                      <button
                        onClick={() => setIsEditingEmail(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
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
                        className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new email"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateEmail}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingEmail(false);
                            setNewEmail(user.email || '');
                          }}
                          className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white text-lg font-semibold">{user?.email || 'No email set'}</p>
                  )}
                </div>

                {/* Password */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-gray-400 font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </label>
                    {!isEditingPassword && (
                      <button
                        onClick={() => setIsEditingPassword(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
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
                          className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="New password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Confirm new password"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdatePassword}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Update Password
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingPassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white text-lg">••••••••</p>
                  )}
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="h-6 w-6 text-purple-400" />
                      <h3 className="text-white font-semibold">Total Chats</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{chatHistory.length}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-6 w-6 text-green-400" />
                      <h3 className="text-white font-semibold">Total Detections</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{detectionHistory.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat History Tab */}
            {activeTab === 'chats' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-purple-400" />
                    Chat History ({chatHistory.length})
                  </h2>
                  <button
                    onClick={loadChatHistory}
                    disabled={isLoadingChats}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-white animate-spin" />
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No chat history yet</p>
                    <p className="text-gray-500 mt-2">Start chatting with the AI advisor!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {chatHistory.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <p className="text-white font-medium line-clamp-2">{chat.message}</p>
                            </div>
                            <div className="flex items-start gap-2 mb-3">
                              <MessageSquare className="h-4 w-4 text-purple-400 mt-1" />
                              <p className="text-gray-400 text-sm line-clamp-3">{chat.response}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(chat.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteChatHistory(chat.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detection History Tab */}
            {activeTab === 'detections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-6 w-6 text-green-400" />
                    Detection History ({detectionHistory.length})
                  </h2>
                  <button
                    onClick={loadDetectionHistory}
                    disabled={isLoadingDetections}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingDetections ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {isLoadingDetections ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-white animate-spin" />
                  </div>
                ) : detectionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No detection history yet</p>
                    <p className="text-gray-500 mt-2">Try detecting some content first!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {detectionHistory.map((detection, index) => (
                      <motion.div
                        key={detection.id}
                        className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 transition-all group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                detection.result === 'AI-Generated' 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                              }`}>
                                {detection.result}
                              </div>
                              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                {detection.confidence}% confidence
                              </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {detection.contentPreview}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(detection.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteDetectionHistory(detection.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;

