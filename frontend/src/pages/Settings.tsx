import { LogOut, Save, Eye, EyeOff, Download, Trash2, Bell, Zap, Shield, AlertCircle, Key, RefreshCw, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

interface AppSettings {
  username: string;
  email: string;
  pushNotifications: boolean;
  emailAlerts: boolean;
  weeklyDigest: boolean;
  riskAlerts: boolean;
  saveHistory: boolean;
  autoDeleteAfterDays: number;
  darkMode: boolean;
  compactMode: boolean;
  confidenceThreshold: number;
  autoRunAnalysis: boolean;
  showMetrics: boolean;
  apiKey: string;
  apiEnabled: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    username: user?.username || 'User',
    email: (user as any)?.email || 'user@example.com',
    pushNotifications: true,
    emailAlerts: true,
    weeklyDigest: false,
    riskAlerts: true,
    saveHistory: true,
    autoDeleteAfterDays: 0,
    darkMode: false,
    compactMode: false,
    confidenceThreshold: 50,
    autoRunAnalysis: false,
    showMetrics: true,
    apiKey: '',
    apiEnabled: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const changePassword = () => {
    setPasswordError('');
    setPasswordMessage('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordMessage('Password updated successfully! (Demo)');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const exportData = () => {
    const data = {
      user: {
        username: settings.username,
        email: settings.email,
      },
      detectionHistory: localStorage.getItem('detection_history'),
      advisorConversations: localStorage.getItem('advisor_conversations'),
      settings: settings,
      exportDate: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-detection-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const clearAllHistory = () => {
    if (window.confirm('This will permanently delete all detection history. This cannot be undone.')) {
      localStorage.removeItem('detection_history');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This is permanent.')) {
      localStorage.clear();
      navigate('/signin');
    }
  };

  const generateApiKey = () => {
    const key = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    handleSettingChange('apiKey', key);
  };

  return (
    <div className="flex bg-neutral-50/40 dark:bg-[#070707] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-300 w-full">
      <Sidebar />

      <main className="flex-1 overflow-y-auto flex flex-col w-full">
        {/* Header */}
        <div className="border-b border-neutral-200/40 dark:border-neutral-800/40 bg-white/70 dark:bg-neutral-950/70 backdrop-blur px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Settings</h1>
              <p className="text-xs text-neutral-550 dark:text-neutral-400 font-semibold mt-1">Manage your developer keys, accounts, and application filters</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-red-200 dark:border-red-950/20 text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-4.5 py-2.5 rounded-xl transition"
            >
              Logout
            </button>
          </div>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-450 font-bold"
              >
                ✓ Settings saved successfully
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6 max-w-4xl mx-auto w-full mb-12">
          
          {/* Account Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 shadow-sm space-y-6"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-neutral-600" />
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-2">Username</label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleSettingChange('username', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200/40 dark:border-neutral-850 bg-transparent rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200/40 dark:border-neutral-850 bg-transparent rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </motion.section>

          {/* Password Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 shadow-sm space-y-6"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-neutral-600" />
              Security Update
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 chars)"
                    className="w-full px-4 py-3 pr-10 border border-neutral-200/40 dark:border-neutral-850 bg-transparent rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 border border-neutral-200/40 dark:border-neutral-850 bg-transparent rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {passwordError && (
              <div className="flex gap-2 rounded-xl bg-red-500/10 text-red-650 dark:text-red-400 p-3.5 border border-red-500/10 text-xs font-semibold">
                <AlertCircle className="h-4 w-4" /> {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="flex gap-2 rounded-xl bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 p-3.5 border border-emerald-500/10 text-xs font-semibold">
                ✓ {passwordMessage}
              </div>
            )}

            <button
              onClick={changePassword}
              className="px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-850 transition"
            >
              Update Password
            </button>
          </motion.section>

          {/* Preferences Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 shadow-sm space-y-6"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-neutral-600" />
              Application Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-900">
                <div>
                  <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Save Diagnostic History</p>
                  <p className="text-[10px] text-neutral-500">Keep history records for analysis preview</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.saveHistory}
                  onChange={(e) => handleSettingChange('saveHistory', e.target.checked)}
                  className="w-4 h-4 accent-neutral-900"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-900">
                <div>
                  <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Confidence Match Warnings</p>
                  <p className="text-[10px] text-neutral-500">Notify when matches exceed thresholds</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.riskAlerts}
                  onChange={(e) => handleSettingChange('riskAlerts', e.target.checked)}
                  className="w-4 h-4 accent-neutral-900"
                />
              </div>
            </div>
          </motion.section>

          {/* Developer API Configuration */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 shadow-sm space-y-6"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-neutral-600" />
              Developer Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-900">
                <div>
                  <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">Enable Developer Keys</p>
                  <p className="text-[10px] text-neutral-500">Activate webhooks and REST integrations</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.apiEnabled}
                  onChange={(e) => handleSettingChange('apiEnabled', e.target.checked)}
                  className="w-4 h-4 accent-neutral-900"
                />
              </div>

              {settings.apiEnabled && (
                <div className="space-y-3 pt-3">
                  <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">Client API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={settings.apiKey || 'No key generated yet'}
                      className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-850 rounded-xl text-xs font-mono font-semibold focus:outline-none"
                    />
                    <button
                      onClick={generateApiKey}
                      className="px-4 py-3 border border-neutral-250 dark:border-neutral-850 rounded-xl text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" /> Generate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* System Actions & Data Portability */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 shadow-sm space-y-6"
          >
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-neutral-600" />
              Portability & Danger Zone
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={exportData}
                className="px-4.5 py-3 border border-neutral-250 dark:border-neutral-850 rounded-xl text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Export Workspace Data
              </button>
              <button
                onClick={clearAllHistory}
                className="px-4.5 py-3 border border-red-200 dark:border-red-950/20 text-red-650 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Clear All History
              </button>
              <button
                onClick={deleteAccount}
                className="px-4.5 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-750 transition flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Permanent Account Delete
              </button>
            </div>
          </motion.section>

          {/* Footer Save Button sticky */}
          <div className="pt-4 flex justify-end gap-3.5">
            <button
              onClick={saveSettings}
              className="px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save Preferences
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
