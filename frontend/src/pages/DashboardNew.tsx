import { Download, Plus, LogOut, Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { detectAiContent, DetectionResponse } from '../api/client';
import { motion } from 'motion/react';

const data = [
  { name: 'Intro', value: 5, historical: 10 },
  { name: 'Body 1', value: 45, historical: 35 },
  { name: 'Body 2', value: 65, historical: 55 },
  { name: 'Conclusion', value: 85, historical: 70 },
];

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-48 h-48 -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-neutral-100"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className="text-neutral-900 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-5xl font-display font-bold tracking-tighter">{percentage}%</span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Likely AI Generated</span>
      </div>
    </div>
  );
};

type Tab = 'detector' | 'overview' | 'history';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('detector');
  const [detectorText, setDetectorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<Array<DetectionResponse & { date: string; preview: string }>>([]);

  const charCount = detectorText.length;
  const wordCount = detectorText.trim() ? detectorText.trim().split(/\s+/).length : 0;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!detectorText || charCount < 10) {
      setError('Please enter at least 10 characters');
      return;
    }
    setLoading(true);
    setError(null);
    setDetectionResult(null);
    try {
      const res = await detectAiContent(detectorText);
      setDetectionResult(res);
      setDetectionHistory(prev => [...prev, {
        ...res,
        date: new Date().toLocaleTimeString(),
        preview: detectorText.substring(0, 100) + (detectorText.length > 100 ? '...' : '')
      }]);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearDetector = () => {
    setDetectorText('');
    setDetectionResult(null);
    setError(null);
  };

  const riskLevel = detectionResult
    ? detectionResult.aiProbability > 0.7
      ? 'High'
      : detectionResult.aiProbability > 0.4
      ? 'Medium'
      : 'Low'
    : null;

  const riskBgColor = riskLevel === 'High' ? '#fca5a5' : riskLevel === 'Medium' ? '#fcd34d' : '#a7f3d0';
  const riskTextColor = riskLevel === 'High' ? '#991b1b' : riskLevel === 'Medium' ? '#92400e' : '#166534';
  const riskProgressColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex bg-white min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight mb-2">AI Guardian</h1>
            <p className="text-neutral-500 font-medium">Detect AI-generated content with precision</p>
            {user?.username && (
              <p className="text-xs text-neutral-400 mt-1">Logged in as: {user.username}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={clearDetector}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200">
          {(['detector', 'overview', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-black border-black'
                  : 'text-neutral-500 border-transparent hover:text-neutral-900'
              }`}
            >
              {tab === 'detector' && 'AI Detector'}
              {tab === 'overview' && 'Overview'}
              {tab === 'history' && 'History'}
            </button>
          ))}
        </div>

        {/* Detector Tab */}
        {activeTab === 'detector' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <textarea
                  value={detectorText}
                  onChange={(e) => setDetectorText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAnalyze();
                    }
                  }}
                  placeholder="Paste or type the text you want to analyze here..."
                  className="w-full min-h-[300px] p-6 text-base focus:outline-none resize-none"
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-neutral-600">
                <span>{charCount} characters</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || charCount < 10}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button
                  onClick={clearDetector}
                  className="px-6 py-3 border border-neutral-200 rounded-lg font-semibold hover:bg-neutral-50 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Results Sidebar */}
            <div className="space-y-4">
              {detectionResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Main Score Card */}
                  <div 
                    className="p-6 rounded-2xl border-2"
                    style={{ borderColor: riskBgColor, backgroundColor: riskBgColor + '20' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {riskLevel === 'High' ? (
                        <AlertTriangle style={{ color: '#dc2626' }} className="w-5 h-5" />
                      ) : (
                        <CheckCircle 
                          style={{ color: riskLevel === 'Yellow' ? '#d97706' : '#16a34a' }} 
                          className="w-5 h-5" 
                        />
                      )}
                      <span className="text-sm font-bold" style={{ color: riskTextColor }}>
                        {riskLevel} Risk
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-600 mb-1">AI Probability</p>
                        <p className="text-3xl font-black">{(detectionResult.aiProbability * 100).toFixed(1)}%</p>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${detectionResult.aiProbability * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ backgroundColor: riskProgressColor }}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="p-4 bg-white border border-neutral-200 rounded-xl">
                    <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Confidence</p>
                    <p className="text-2xl font-bold">{(detectionResult.confidenceScore * 100).toFixed(1)}%</p>
                  </div>

                  {/* Analysis */}
                  <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-xs uppercase tracking-widest text-neutral-600 font-semibold">Analysis</p>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{detectionResult.analysis}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 bg-white border border-neutral-200 rounded-2xl text-center">
                  <p className="text-sm text-neutral-500">Submit text to see results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* AI Probability Card */}
            <div className="lg:col-span-1 bg-white border border-neutral-100 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[360px] shadow-sm">
              <div className="self-start mb-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                Latest Analysis
              </div>
              <CircularProgress percentage={detectionResult ? Math.round(detectionResult.aiProbability * 100) : 0} />
              <div className="mt-auto" />
            </div>

            {/* Confidence Trends Card */}
            <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-3xl p-8 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Confidence Trends</div>
                <div className="flex p-1 bg-neutral-50 rounded-lg border border-neutral-100">
                  <button className="px-3 py-1 bg-white shadow-sm rounded-md text-[10px] font-bold uppercase tracking-wider">This Scan</button>
                  <button className="px-3 py-1 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Historical</button>
                </div>
              </div>

              <div className="flex-1 -mx-8 -mb-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 500 }}
                      dy={16}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#171717" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Detection History</h2>
            {detectionHistory.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No detection history yet. Start by analyzing some text!</p>
            ) : (
              <div className="space-y-3">
                {detectionHistory.map((item, idx) => (
                  <div key={idx} className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{item.preview}</p>
                      <p className="text-xs text-neutral-500 mt-1">{item.date}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-bold">{(item.aiProbability * 100).toFixed(1)}%</p>
                        <p className="text-xs text-neutral-500">AI Probability</p>
                      </div>
                      {item.aiProbability > 0.7 ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : item.aiProbability > 0.4 ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 right-0 left-64 bg-white/80 backdrop-blur pb-6 pt-4 px-12 border-t border-neutral-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-neutral-400 font-medium">
          <div className="uppercase tracking-widest flex items-center gap-2">
            © 2024 AI GUARDIAN INC. <span className="text-neutral-200">|</span> BUILT FOR PRECISION.
          </div>
          <div className="flex items-center gap-6 uppercase tracking-widest">
            <a href="#" className="hover:text-neutral-900">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-900">Terms of Service</a>
            <a href="#" className="hover:text-neutral-900">API Documentation</a>
            <a href="#" className="hover:text-neutral-900">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
