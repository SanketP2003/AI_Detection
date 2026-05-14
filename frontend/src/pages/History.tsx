import { LogOut, AlertTriangle, CheckCircle, Trash2, Search, Download, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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

  const getRiskColor = (prob: number) => {
    if (prob >= 0.7) return '#dc2626';
    if (prob >= 0.4) return '#f59e0b';
    return '#22c55e';
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecord(null);
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all detection history? This cannot be undone.')) {
      setRecords([]);
      localStorage.removeItem('detection_history');
      setSelectedRecord(null);
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'AI Probability', 'Confidence', 'Risk Level', 'Perplexity', 'Burstiness', 'Consistency', 'Text Preview'],
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
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-white px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Detection History</h1>
              <p className="text-sm text-neutral-500 mt-1">View and manage all your detection analyses</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Detections</p>
              <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">High Risk</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{stats.highRisk}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Avg AI Probability</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{stats.avgAI}%</p>
            </div>
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">User</p>
              <p className="text-lg font-semibold text-neutral-900 mt-2 truncate">{user?.username || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-8">
          {/* Controls */}
          <div className="space-y-4 mb-8">
            {/* Search and Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by text or analysis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestAI">Highest AI %</option>
                <option value="lowestAI">Lowest AI %</option>
              </select>

              {records.length > 0 && (
                <>
                  <button
                    onClick={exportHistory}
                    className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition inline-flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={clearAllHistory}
                    className="px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition inline-flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Records List */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 font-medium">
                {records.length === 0 ? 'No detection history yet.' : 'No results match your filters.'}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {records.length === 0 ? 'Analyze text in the Detector to start building history.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRecord(record)}
                  className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm cursor-pointer transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 line-clamp-2">{record.preview}</p>
                      <p className="text-xs text-neutral-500 mt-1">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-900">{(record.aiProbability * 100).toFixed(1)}%</p>
                        <p className="text-xs text-neutral-500">{getRiskLevel(record.aiProbability)}</p>
                      </div>
                      {record.aiProbability >= 0.7 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : record.aiProbability >= 0.4 ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2">{record.analysis}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRecord && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedRecord(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900">Detection Details</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Risk Overview */}
              <div
                className="rounded-lg border-2 p-4"
                style={{
                  borderColor: getRiskColor(selectedRecord.aiProbability),
                  backgroundColor: getRiskColor(selectedRecord.aiProbability) + '15',
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: getRiskColor(selectedRecord.aiProbability) }}>
                  {getRiskLevel(selectedRecord.aiProbability)} Risk
                </p>
                <p className="text-3xl font-bold text-neutral-900">
                  {(selectedRecord.aiProbability * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Confidence: {(selectedRecord.confidenceScore * 100).toFixed(1)}%
                </p>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500 font-medium mb-2">Perplexity</p>
                    <p className="text-xl font-bold text-neutral-900">
                      {(selectedRecord.metrics.perplexity * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500 font-medium mb-2">Burstiness</p>
                    <p className="text-xl font-bold text-neutral-900">
                      {(selectedRecord.metrics.burstiness * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500 font-medium mb-2">Consistency</p>
                    <p className="text-xl font-bold text-neutral-900">
                      {(selectedRecord.metrics.consistency * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Analysis</h3>
                <p className="text-sm text-neutral-700 leading-relaxed">{selectedRecord.analysis}</p>
              </div>

              {/* Patterns */}
              {selectedRecord.patterns.length > 0 && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Observed Patterns</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.patterns.map((pattern, idx) => (
                      <span key={idx} className="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-xs text-neutral-700">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Text */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Original Text</h3>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedRecord.text}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    deleteRecord(selectedRecord.id);
                  }}
                  className="flex-1 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
