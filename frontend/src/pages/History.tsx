import { LogOut, AlertTriangle, CheckCircle, Trash2, Search, Download, BarChart3, HelpCircle, Eye, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

interface DetectionRecord {
  id: string;
  timestamp: number;
  text: string;
  preview: string;
  aiProbability: number;
  confidenceScore: number;
  metrics: {
    perplexity: number;
    burstiness: number;
    consistency: number;
  };
  analysis: string;
  patterns: string[];
}

export default function History() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DetectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<DetectionRecord | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  // Tab state
  const [activeTab, setActiveTab] = useState<'detector' | 'advisor'>(() => {
    return (localStorage.getItem('preferred_history_tab') as 'detector' | 'advisor') || 'detector';
  });

  // Save activeTab preference
  useEffect(() => {
    localStorage.setItem('preferred_history_tab', activeTab);
  }, [activeTab]);

  // Advisor chats state
  const [advisorChats, setAdvisorChats] = useState<any[]>([]);
  const [filteredAdvisorChats, setFilteredAdvisorChats] = useState<any[]>([]);
  const [selectedAdvisorChat, setSelectedAdvisorChat] = useState<any | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('detection_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }

    const savedChats = localStorage.getItem('advisor_conversations');
    if (savedChats) {
      try {
        setAdvisorChats(JSON.parse(savedChats));
      } catch (e) {
        console.error('Failed to load advisor conversations:', e);
      }
    }
  }, []);

  // Filter and sort records
  useEffect(() => {
    let filtered = [...records];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((r) =>
        r.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.analysis.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter((r) => {
        const risk = getRiskLevel(r.aiProbability);
        return risk.toLowerCase() === selectedRisk.toLowerCase();
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'highestAI') return b.aiProbability - a.aiProbability;
      if (sortBy === 'lowestAI') return a.aiProbability - b.aiProbability;
      return 0;
    });

    setFilteredRecords(filtered);
  }, [records, searchTerm, selectedRisk, sortBy]);

  // Filter and sort advisor chats
  useEffect(() => {
    let filtered = [...advisorChats];

    if (searchTerm.trim()) {
      filtered = filtered.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.messages.some((m: any) => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    filtered.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    setFilteredAdvisorChats(filtered);
  }, [advisorChats, searchTerm]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRiskLevel = (prob: number) => {
    if (prob >= 0.7) return 'High';
    if (prob >= 0.4) return 'Medium';
    return 'Low';
  };

  const getRiskBadgeStyles = (prob: number) => {
    if (prob >= 0.7) {
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-400 border-red-200/40 dark:border-red-950/20',
        progress: '#ef4444'
      };
    }
    if (prob >= 0.4) {
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-650 dark:text-amber-400 border-amber-200/40 dark:border-amber-950/20',
        progress: '#f59e0b'
      };
    }
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-950/20',
      progress: '#10b981'
    };
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem('detection_history', JSON.stringify(updated));
    setSelectedRecord(null);
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all detection history? This cannot be undone.')) {
      setRecords([]);
      localStorage.removeItem('detection_history');
      setSelectedRecord(null);
    }
  };

  const clearAllAdvisorHistory = () => {
    if (window.confirm('Are you sure you want to clear all advisor chat history? This cannot be undone.')) {
      setAdvisorChats([]);
      localStorage.removeItem('advisor_conversations');
      setSelectedAdvisorChat(null);
    }
  };

  const resumeAdvisorChat = (id: string) => {
    localStorage.setItem('active_advisor_chat_id', id);
    navigate('/advisor');
  };

  const deleteAdvisorChat = (id: string) => {
    if (window.confirm('Are you sure you want to delete this advisor chat?')) {
      const updated = advisorChats.filter((c) => c.id !== id);
      setAdvisorChats(updated);
      localStorage.setItem('advisor_conversations', JSON.stringify(updated));
      setSelectedAdvisorChat(null);
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Match Probability', 'Confidence', 'Risk Level', 'Perplexity', 'Burstiness', 'Consistency', 'Text Preview'],
      ...filteredRecords.map((r) => [
        new Date(r.timestamp).toLocaleString(),
        (r.aiProbability * 100).toFixed(1) + '%',
        (r.confidenceScore * 100).toFixed(1) + '%',
        getRiskLevel(r.aiProbability),
        (r.metrics.perplexity * 100).toFixed(1) + '%',
        (r.metrics.burstiness * 100).toFixed(1) + '%',
        (r.metrics.consistency * 100).toFixed(1) + '%',
        r.preview.substring(0, 100),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: records.length,
    highRisk: records.filter((r) => r.aiProbability >= 0.7).length,
    avgAI: records.length > 0 ? (records.reduce((sum, r) => sum + r.aiProbability, 0) / records.length * 100).toFixed(1) : 0,
  };

  return (
    <div className="flex bg-neutral-50/40 dark:bg-[#070707] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-300 w-full">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col w-full relative">
        {/* Header */}
        <div className="border-b border-neutral-200/40 dark:border-neutral-800/40 bg-white/70 dark:bg-neutral-950/70 backdrop-blur px-8 py-6 flex flex-col z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Console History</h1>
              <p className="text-xs text-neutral-550 dark:text-neutral-400 font-semibold mt-1">Review and manage past verification logs and advisor consultations</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-red-200 dark:border-red-950/20 text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-4.5 py-2.5 rounded-xl transition"
            >
              Logout
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-6 mt-6 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-px">
            <button
              onClick={() => setActiveTab('detector')}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all duration-200 ${
                activeTab === 'detector'
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              Verification Logs
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all duration-200 ${
                activeTab === 'advisor'
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              Advisor Consultations
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {activeTab === 'detector' ? (
              <>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">Total Detections</p>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">High Risk</p>
                  <p className="text-2xl font-extrabold text-red-650 mt-1">{stats.highRisk}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest font-bold">Avg Match Probability</p>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">{stats.avgAI}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">Total Conversations</p>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">{advisorChats.length}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">Total Messages</p>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
                    {advisorChats.reduce((sum, c) => sum + c.messages.length, 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
                  <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-550 uppercase tracking-widest">Avg Chat Length</p>
                  <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
                    {advisorChats.length > 0 ? (advisorChats.reduce((sum, c) => sum + c.messages.length, 0) / advisorChats.length).toFixed(1) : '0.0'}
                  </p>
                </div>
              </>
            )}
            <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200/40 dark:border-neutral-850 p-4.5 shadow-sm">
              <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Active User</p>
              <p className="text-base font-bold text-neutral-800 dark:text-neutral-200 mt-1.5 truncate">{user?.username || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-8 py-8 w-full mb-12">
          <div className="max-w-4xl mx-auto space-y-6 w-full">
            
            {/* Filter controls */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'detector' ? "Search past scans..." : "Search past consultations..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200/40 dark:border-neutral-850 rounded-xl text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder:text-neutral-450 shadow-sm"
                />
              </div>

              {activeTab === 'detector' ? (
                <>
                  <select
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                    className="px-4 py-3 border border-neutral-200/40 dark:border-neutral-850 rounded-xl text-xs font-bold bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-neutral-200/40 dark:border-neutral-850 rounded-xl text-xs font-bold bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highestAI">Highest Match %</option>
                    <option value="lowestAI">Lowest Match %</option>
                  </select>

                  {records.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={exportHistory}
                        className="px-4.5 py-3 border border-neutral-200/45 dark:border-neutral-850 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition shadow-sm flex items-center gap-1.5"
                      >
                        <Download className="h-4 w-4" /> Export CSV
                      </button>
                      <button
                        onClick={clearAllHistory}
                        className="px-4.5 py-3 border border-red-200 dark:border-red-950/20 rounded-xl text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition shadow-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Clear All
                      </button>
                    </div>
                  )}
                </>
              ) : (
                advisorChats.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={clearAllAdvisorHistory}
                      className="px-4.5 py-3 border border-red-200 dark:border-red-950/20 rounded-xl text-xs font-bold text-red-650 dark:text-red-405 hover:bg-red-50 dark:hover:bg-red-950/25 transition shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Clear All Chats
                    </button>
                  </div>
                )
              )}
            </div>

            {/* List Content */}
            {activeTab === 'detector' ? (
              filteredRecords.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-neutral-500 dark:text-neutral-450 text-sm font-semibold">
                    {records.length === 0 ? 'No detection history yet.' : 'No records match filters.'}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {records.length === 0 ? 'Analyze text inside the detector to build your history log.' : 'Adjust search terms or try another risk filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {filteredRecords.map((record, index) => {
                    const bStyles = getRiskBadgeStyles(record.aiProbability);
                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedRecord(record)}
                        className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-6 hover:border-neutral-400 dark:hover:border-neutral-750 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full shadow-sm"
                      >
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 leading-relaxed">{record.preview}</p>
                          <div className="flex items-center gap-4 text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(record.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{record.preview.trim().split(/\s+/).length} Words</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0 self-end md:self-center">
                          <div className="text-right">
                            <p className="text-lg font-black text-neutral-900 dark:text-white">{(record.aiProbability * 100).toFixed(0)}%</p>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${bStyles.bg}`}>
                              {getRiskLevel(record.aiProbability)} Match
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center border border-neutral-200/10 hover:bg-neutral-100 transition-colors">
                            <Eye className="w-4 h-4 text-neutral-500" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              filteredAdvisorChats.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-neutral-500 dark:text-neutral-450 text-sm font-semibold">
                    {advisorChats.length === 0 ? 'No advisor consultations yet.' : 'No conversations match search.'}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {advisorChats.length === 0 ? 'Ask questions inside the Advisor console to build a log.' : 'Adjust search terms to find other consultations.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {filteredAdvisorChats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedAdvisorChat(chat)}
                      className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-6 hover:border-neutral-400 dark:hover:border-neutral-750 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full shadow-sm"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 leading-relaxed">{chat.title}</p>
                        <div className="flex items-center gap-4 text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{chat.messages.length} Messages</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeAdvisorChat(chat.id);
                          }}
                          className="px-4.5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition shadow-sm active:scale-95"
                        >
                          Resume Chat
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAdvisorChat(chat.id);
                          }}
                          className="p-2.5 rounded-xl border border-red-200 dark:border-red-950/20 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center border border-neutral-200/10 hover:bg-neutral-100 transition-colors">
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Side Slide-in Preview Drawer Modal for Verification logs */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedRecord(null)}
            />

            {/* Slide Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white dark:bg-neutral-950 h-full shadow-2xl flex flex-col z-10 border-l border-neutral-200/40 dark:border-neutral-850"
            >
              {/* Header */}
              <div className="border-b border-neutral-200/40 dark:border-neutral-850 px-6 py-5 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                <div>
                  <h2 className="font-extrabold text-neutral-900 dark:text-white">Scan Diagnostics</h2>
                  <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Scanned on {new Date(selectedRecord.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-550 dark:text-neutral-400 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scroll Pane */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Risk Banner */}
                {(() => {
                  const bStyles = getRiskBadgeStyles(selectedRecord.aiProbability);
                  return (
                    <div className={`rounded-2xl border p-6 flex flex-col justify-between ${bStyles.bg}`}>
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {getRiskLevel(selectedRecord.aiProbability)} Match Probability
                      </span>
                      <p className="text-4xl font-display font-black mt-2">{(selectedRecord.aiProbability * 100).toFixed(1)}%</p>
                      <div className="h-2 rounded-full bg-neutral-200/40 dark:bg-neutral-800/40 overflow-hidden mt-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedRecord.aiProbability * 100}%` }}
                          style={{ backgroundColor: bStyles.progress }}
                          className="h-full rounded-full"
                        />
                      </div>
                      <p className="text-[9px] text-neutral-500 uppercase tracking-wider mt-3 font-semibold">
                        Overall confidence score: {(selectedRecord.confidenceScore * 100).toFixed(1)}%
                      </p>
                    </div>
                  );
                })()}

                {/* Metrics Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Key Performance Indicators</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-neutral-200/40 dark:border-neutral-850 p-4 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Perplexity</p>
                      <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1">{(selectedRecord.metrics.perplexity * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200/40 dark:border-neutral-850 p-4 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Burstiness</p>
                      <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1">{(selectedRecord.metrics.burstiness * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200/40 dark:border-neutral-850 p-4 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Consistency</p>
                      <p className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1">{(selectedRecord.metrics.consistency * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis text */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Diagnostic Report</h3>
                  <p className="text-xs font-semibold leading-relaxed text-neutral-650 dark:text-neutral-350 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/40 dark:border-neutral-850 p-5 rounded-2xl">{selectedRecord.analysis}</p>
                </div>

                {/* Patterns list */}
                {selectedRecord.patterns.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Observed Signatures</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.patterns.map((pattern, idx) => (
                        <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/30 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source text block */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Analyzed Document Copy</h3>
                  <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/40 dark:border-neutral-850 rounded-2xl p-5 max-h-64 overflow-y-auto shadow-inner">
                    <p className="text-xs font-medium text-neutral-650 dark:text-neutral-355 whitespace-pre-wrap leading-relaxed">{selectedRecord.text}</p>
                  </div>
                </div>
              </div>

              {/* Actions panel footer */}
              <div className="p-6 border-t border-neutral-200/40 dark:border-neutral-850 bg-white/40 dark:bg-neutral-950/40 backdrop-blur flex gap-3.5">
                <button
                  onClick={() => deleteRecord(selectedRecord.id)}
                  className="flex-1 py-3 border border-red-200 dark:border-red-950/20 rounded-xl text-xs font-bold text-red-650 dark:text-red-455 hover:bg-red-50 dark:hover:bg-red-950/25 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> Delete Record
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition shadow-md"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Side Slide-in Preview Drawer Modal for Advisor Chats */}
      <AnimatePresence>
        {selectedAdvisorChat && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedAdvisorChat(null)}
            />

            {/* Slide Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white dark:bg-neutral-950 h-full shadow-2xl flex flex-col z-10 border-l border-neutral-200/40 dark:border-neutral-850"
            >
              {/* Header */}
              <div className="border-b border-neutral-200/40 dark:border-neutral-850 px-6 py-5 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                <div>
                  <h2 className="font-extrabold text-neutral-900 dark:text-white">Advisor Consultation</h2>
                  <p className="text-[10px] text-neutral-550 dark:text-neutral-400 font-semibold mt-0.5">Consulted on {new Date(selectedAdvisorChat.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedAdvisorChat(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-550 dark:text-neutral-400 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scroll Pane of messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/20 dark:bg-[#070707]/10">
                {selectedAdvisorChat.messages.map((m: any, idx: number) => {
                  const isBot = m.role === 'assistant';
                  return (
                    <div key={idx} className={`flex flex-col gap-1.5 ${isBot ? 'items-start' : 'items-end'}`}>
                      <span className="text-[9px] font-bold text-neutral-450 dark:text-neutral-555 uppercase tracking-widest">
                        {isBot ? 'Forensic Advisor' : 'User'}
                      </span>
                      <div className={`rounded-2xl p-4 border text-xs leading-relaxed shadow-sm max-w-md ${
                        isBot 
                          ? 'bg-white border-neutral-200/40 dark:bg-neutral-950 dark:border-neutral-850 text-neutral-800 dark:text-neutral-200' 
                          : 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-955'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions panel footer */}
              <div className="p-6 border-t border-neutral-200/40 dark:border-neutral-850 bg-white/40 dark:bg-neutral-950/40 backdrop-blur flex gap-3.5">
                <button
                  onClick={() => {
                    const id = selectedAdvisorChat.id;
                    setSelectedAdvisorChat(null);
                    deleteAdvisorChat(id);
                  }}
                  className="flex-1 py-3 border border-red-200 dark:border-red-950/20 rounded-xl text-xs font-bold text-red-650 dark:text-red-405 hover:bg-red-50 dark:hover:bg-red-950/25 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> Delete Chat
                </button>
                <button
                  onClick={() => {
                    const id = selectedAdvisorChat.id;
                    setSelectedAdvisorChat(null);
                    resumeAdvisorChat(id);
                  }}
                  className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition shadow-md"
                >
                  Resume Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
