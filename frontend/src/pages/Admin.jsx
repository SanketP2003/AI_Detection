import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getMe,
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminRecentHistory,
  adminHistoryForUser,
  adminRecentChats,
  adminChatsForUser,
} from '../api/client';
import {
  Users,
  Activity,
  MessageSquare,
  CheckCircle,
  UserPlus,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Admin = () => {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [chat, setChat] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [creating, setCreating] = useState({ username: '', password: '', email: '', roles: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    (async () => {
      const info = await getMe();
      setMe(info);
      if (info?.isAdmin) {
        await Promise.all([loadUsers(), loadRecentHistory(), loadRecentChats()]);
      }
    })();
  }, []);

  async function loadUsers() {
    try {
      setUsers(await adminListUsers());
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadRecentHistory() {
    setSelectedUser('');
    try {
      setHistory(await adminRecentHistory());
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadHistoryForUser(username) {
    setSelectedUser(username);
    try {
      setHistory(await adminHistoryForUser(username));
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadRecentChats() {
    setSelectedUser('');
    try {
      setChat(await adminRecentChats());
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadChatsForUser(username) {
    setSelectedUser(username);
    try {
      setChat(await adminChatsForUser(username));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...creating };
      if (!payload.roles) delete payload.roles;
      const newUser = await adminCreateUser(payload);
      setUsers(prev => [...prev, newUser]);
      setCreating({ username: '', password: '', email: '', roles: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id, partial) {
    try {
      const updated = await adminUpdateUser(id, partial);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!globalThis.confirm('Delete user?')) return;
    try {
      await adminDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-night text-gray-text flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em]">Checking access</div>
      </div>
    );
  }

  if (!me.authenticated) {
    return (
      <div className="min-h-screen bg-night text-gray-text flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em]">Login required</div>
      </div>
    );
  }

  if (!me.isAdmin) {
    return (
      <div className="min-h-screen bg-night text-gray-text flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em]">Admins only</div>
      </div>
    );
  }

  const chartData = Array.from({ length: 30 }).map((_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - idx));
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayHistory = history.filter(h => new Date(h.createdAt).toDateString() === date.toDateString());
    const dayChat = chat.filter(c => new Date(c.createdAt).toDateString() === date.toDateString());
    return { date: label, detector: dayHistory.length, advisor: dayChat.length };
  });

  const detectionData = [
    { name: 'AI-Generated', value: history.filter(h => h.result === 'AI').length, color: '#f6c343' },
    { name: 'Human-Written', value: history.filter(h => h.result === 'HUMAN').length, color: '#6ed8b5' },
  ];

  const topUsers = Object.entries([...history, ...chat].reduce((acc, entry) => {
    acc[entry.username] = (acc[entry.username] || 0) + 1;
    return acc;
  }, {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([username, count]) => ({ username, count }));

  const sections = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'detections', label: 'Detections', icon: Activity },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-night text-gray-text">
      <Header />
      <main className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Hero */}
          <div className="section-shell grid-overlay grain">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-mist/60">Command center</p>
                  <h1 className="text-4xl sm:text-5xl font-space text-white">Admin control</h1>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => Promise.all([loadUsers(), loadRecentHistory(), loadRecentChats()])} className="px-4 py-2 rounded-2xl border border-white/10 text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Refresh data
                  </button>
                  <div className="px-4 py-2 rounded-2xl border border-white/10 text-xs uppercase tracking-[0.4em] text-mist/70">
                    {selectedUser ? `Scope: ${selectedUser}` : 'Scope: global'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ label: 'Users', value: users.length, icon: Users },
                  { label: 'Scans', value: history.length, icon: Activity },
                  { label: 'Chats', value: chat.length, icon: MessageSquare },
                  { label: 'Status', value: 'Operational', icon: CheckCircle }].map(card => (
                  <div key={card.label} className="glass-panel border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-mist/60 uppercase tracking-[0.3em]">{card.label}</p>
                      <p className="text-2xl font-space text-white mt-2">{card.value}</p>
                    </div>
                    <card.icon className="h-5 w-5 text-accent" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="glass-panel border-red-500/30 text-red-300 p-4 text-sm">{error}</div>}

          {/* Tabs */}
          <nav className="flex flex-wrap gap-2">
            {sections.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl border text-sm flex items-center gap-2 transition ${
                  activeTab === tab.id ? 'border-white/20 text-white' : 'border-white/5 text-mist/70 hover:text-white hover:border-white/15'
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </nav>

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="grid gap-6">
              <div className="glass-panel border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-mist/50">Trends</p>
                    <h2 className="text-xl text-white">Service activity (30d)</h2>
                  </div>
                  <div className="flex gap-2 text-xs text-mist/70">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning"></span> Detector</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success"></span> Advisor</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#111114', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="detector" stroke="#f6c343" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="advisor" stroke="#6ed8b5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel border-white/5 p-6">
                  <h3 className="text-lg text-white mb-4">Detection mix</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie data={detectionData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={4}>
                        {detectionData.map(entry => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111114', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-panel border-white/5 p-6">
                  <h3 className="text-lg text-white mb-4">Most active users</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topUsers}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="username" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#111114', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="count" fill="#b080ff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="grid gap-6">
              <div className="glass-panel border-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-mist/60">Create</p>
                    <h2 className="text-xl text-white">New account</h2>
                  </div>
                </div>
                <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-5">
                  {['username', 'password', 'email', 'roles'].map(field => (
                    <input
                      key={field}
                      type={field === 'password' ? 'password' : 'text'}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={creating[field]}
                      onChange={e => setCreating(prev => ({ ...prev, [field]: e.target.value }))}
                      required={field === 'username' || field === 'password'}
                      className="bg-carbon border border-white/10 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ))}
                  <button
                    disabled={loading}
                    className="rounded-2xl bg-white text-black font-space text-sm uppercase tracking-[0.3em]"
                  >
                    {loading ? 'Creating' : 'Create'}
                  </button>
                </form>
              </div>
              <div className="glass-panel border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-mist/60">Directory</p>
                    <h2 className="text-xl text-white">Users ({users.length})</h2>
                  </div>
                  <button onClick={loadUsers} className="px-4 py-2 rounded-2xl border border-white/10 text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Reload
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-mist/60">
                      <tr>
                        {['ID', 'Username', 'Email', 'Roles', 'Actions'].map(header => (
                          <th key={header} className="text-left py-3 border-b border-white/10">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-white/5">
                          <td className="py-3">{user.id}</td>
                          <td className="py-3 font-medium">{user.username}</td>
                          <td className="py-3 text-mist/70">{user.email || '-'}</td>
                          <td className="py-3">
                            <span className="px-3 py-1 rounded-full border border-white/10 text-xs">{user.roles}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setActiveTab('detections');
                                  loadHistoryForUser(user.username);
                                }}
                                className="p-2 rounded-xl border border-white/10 text-xs"
                              >
                                History
                              </button>
                              <button
                                onClick={() => handleUpdate(user.id, { roles: prompt('Roles', user.roles) || user.roles })}
                                className="p-2 rounded-xl border border-white/10 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 rounded-xl border border-red-500/30 text-xs text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Detections */}
          {activeTab === 'detections' && (
            <div className="glass-panel border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-mist/60">Detections</p>
                  <h2 className="text-xl text-white">{selectedUser ? `History for ${selectedUser}` : 'Global history'}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadRecentHistory} className="px-4 py-2 rounded-2xl border border-white/10 text-sm">Global</button>
                  {selectedUser && (
                    <button onClick={() => loadHistoryForUser(selectedUser)} className="px-4 py-2 rounded-2xl border border-white/10 text-sm">Refresh</button>
                  )}
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {history.length === 0 && <div className="py-16 text-center text-mist/60">No records</div>}
                {history.map(entry => (
                  <div key={entry.id} className="soft-border p-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm text-mist/70">
                      <span>{entry.username}</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs uppercase tracking-[0.3em]">
                      <span className={`px-3 py-1 rounded-full ${entry.result === 'AI' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                        {entry.result}
                      </span>
                      <span className="px-3 py-1 rounded-full border border-white/10 text-mist/70">{entry.confidence}% conf</span>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2">{entry.contentPreview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chats */}
          {activeTab === 'chats' && (
            <div className="glass-panel border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-mist/60">Chats</p>
                  <h2 className="text-xl text-white">{selectedUser ? `History for ${selectedUser}` : 'Global threads'}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadRecentChats} className="px-4 py-2 rounded-2xl border border-white/10 text-sm">Global</button>
                  {selectedUser && (
                    <button onClick={() => loadChatsForUser(selectedUser)} className="px-4 py-2 rounded-2xl border border-white/10 text-sm">Refresh</button>
                  )}
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {chat.length === 0 && <div className="py-16 text-center text-mist/60">No records</div>}
                {chat.map(entry => (
                  <div key={entry.id} className="soft-border p-4 flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-mist/70">
                      <span>{entry.username}</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-xs text-accent uppercase tracking-[0.4em]">Prompt</span>
                        <p className="text-sm text-white/80">{entry.prompt}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs text-success uppercase tracking-[0.4em]">Response</span>
                        <p className="text-sm text-white/80">{entry.response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
