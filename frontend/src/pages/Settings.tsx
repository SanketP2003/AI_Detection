import { LogOut, Save, Eye, EyeOff, Download, Trash2, Bell, Moon, Zap, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteDataConfirm, setDeleteDataConfirm] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    username: user?.username || 'User',
    email: user?.email || 'user@example.com',
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

    setPasswordMessage('Password changed successfully! (Demo)');
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
      setDeleteDataConfirm(false);
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
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-white px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage your account and preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
            >
              ✓ Settings saved successfully
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          {/* Account Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Username</label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleSettingChange('username', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-1">Your unique identifier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-1">Used for notifications and account recovery</p>
              </div>
            </div>
          </motion.section>

          {/* Password Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-2 pr-10 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {passwordError && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {passwordMessage}
                </div>
              )}

              <button
                onClick={changePassword}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
              >
                Update Password
              </button>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h2>
            <div className="space-y-4">
              {[
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get browser notifications' },
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alerts via email' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your activity' },
                { key: 'riskAlerts', label: 'High Risk Alerts', desc: 'Alerts for high-risk detections' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-neutral-200 last:border-0">
                  <div>
                    <p className="font-medium text-neutral-900">{item.label}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof AppSettings] as boolean}
                      onChange={(e) => handleSettingChange(item.key as keyof AppSettings, e.target.checked)}
                      className="w-5 h-5 rounded accent-neutral-900"
                    />
                  </label>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Appearance Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-neutral-900">Dark Mode</p>
                  <p className="text-xs text-neutral-500">Use dark theme</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    className="w-5 h-5 rounded accent-neutral-900"
                  />
                </label>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Compact Mode</p>
                    <p className="text-xs text-neutral-500">Reduce spacing for more content</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                      className="w-5 h-5 rounded accent-neutral-900"
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Detection Preferences */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Detection Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-3">
                  Confidence Threshold: {settings.confidenceThreshold}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={settings.confidenceThreshold}
                  onChange={(e) => handleSettingChange('confidenceThreshold', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-neutral-500 mt-2">Show results with confidence above this threshold</p>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Show All Metrics</p>
                    <p className="text-xs text-neutral-500">Display perplexity, burstiness, consistency</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showMetrics}
                      onChange={(e) => handleSettingChange('showMetrics', e.target.checked)}
                      className="w-5 h-5 rounded accent-neutral-900"
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data & Privacy */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data & Privacy
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-neutral-900">Save Detection History</p>
                  <p className="text-xs text-neutral-500">Keep records of analyses</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.saveHistory}
                    onChange={(e) => handleSettingChange('saveHistory', e.target.checked)}
                    className="w-5 h-5 rounded accent-neutral-900"
                  />
                </label>
              </div>

              {settings.saveHistory && (
                <div className="border-t border-neutral-200 pt-4">
                  <label className="block text-sm font-medium text-neutral-900 mb-3">
                    Auto-delete history after: {settings.autoDeleteAfterDays === 0 ? 'Never' : settings.autoDeleteAfterDays + ' days'}
                  </label>
                  <select
                    value={settings.autoDeleteAfterDays}
                    onChange={(e) => handleSettingChange('autoDeleteAfterDays', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value={0}>Never delete</option>
                    <option value={30}>After 30 days</option>
                    <option value={60}>After 60 days</option>
                    <option value={90}>After 90 days</option>
                  </select>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <button
                  onClick={exportData}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition inline-flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download My Data
                </button>

                <button
                  onClick={() => setDeleteDataConfirm(true)}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All History
                </button>
              </div>
            </div>
          </motion.section>

          {/* API Settings */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg border border-neutral-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">API Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Enable API Access</p>
                  <p className="text-xs text-neutral-500">Allow external applications to use your account</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.apiEnabled}
                    onChange={(e) => handleSettingChange('apiEnabled', e.target.checked)}
                    className="w-5 h-5 rounded accent-neutral-900"
                  />
                </label>
              </div>

              {settings.apiEnabled && (
                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.apiKey}
                        readOnly
                        className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 font-mono"
                        placeholder="Generate an API key"
                      />
                      <button
                        onClick={generateApiKey}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Keep this key secure. Never share it publicly.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-lg border border-red-200 bg-red-50 p-6 mb-12"
          >
            <h2 className="text-lg font-semibold text-red-900 mb-6">Danger Zone</h2>
            <div className="space-y-3">
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition"
              >
                Delete Account
              </button>
              <p className="text-xs text-red-700">This action cannot be undone. All your data will be permanently deleted.</p>
            </div>
          </motion.section>

          {/* Save Button */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={saveSettings}
              className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <p className="font-semibold text-neutral-900 mb-2">Delete Account?</p>
            <p className="text-sm text-neutral-600 mb-6">
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Clear History Confirmation Modal */}
      {deleteDataConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <p className="font-semibold text-neutral-900 mb-2">Clear All History?</p>
            <p className="text-sm text-neutral-600 mb-6">
              This will permanently delete all your detection history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDataConfirm(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={clearAllHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
