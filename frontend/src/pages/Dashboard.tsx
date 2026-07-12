import { LogOut, ArrowRight, Zap, AlertTriangle, CheckCircle, BarChart3, Clock, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const chartData = [
  { name: 'Mon', value: 5 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 65 },
  { name: 'Thu', value: 85 },
  { name: 'Fri', value: 72 },
  { name: 'Sat', value: 58 },
  { name: 'Sun', value: 90 },
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
          strokeWidth="10"
          fill="transparent"
          className="text-neutral-100 dark:text-neutral-900"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white">{percentage}%</span>
        <span className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mt-1.5">Avg Pattern Match</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [totalScans, setTotalScans] = useState(0);
  const [aiScans, setAiScans] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('detection_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        if (history.length > 0) {
          setTotalScans(history.length);
          const aiCount = history.filter((r: any) => r.aiProbability >= 0.5).length;
          setAiScans(aiCount);
          const sumConf = history.reduce((acc: number, curr: any) => acc + curr.confidenceScore, 0);
          setAvgConfidence(Math.round((sumConf / history.length) * 100));
        }
      } catch (e) {
        console.error('Failed to parse history:', e);
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

  const detectionRate = totalScans > 0 ? Math.round((aiScans / totalScans) * 100) : 0;

  return (
    <div className="flex bg-neutral-50/40 dark:bg-[#070707] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-7xl mx-auto space-y-10 w-full mb-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-neutral-200/40 dark:border-neutral-800/40 pb-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold mt-1">Console Analytics & System Metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-red-200 dark:border-red-950/20 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Probability Card */}
          <div className="lg:col-span-1 glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[350px] shadow-sm relative overflow-hidden">
            <div className="self-start mb-auto text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
              Global Average
            </div>
            <CircularProgress percentage={detectionRate || 72} />
            <div className="mt-auto" />
          </div>

          {/* Confidence Trends Card */}
          <div className="lg:col-span-2 glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-8 flex flex-col shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Detection Activity
              </div>
              <div className="flex p-0.5 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/20 dark:border-neutral-800/30">
                <button className="px-3.5 py-1.5 bg-white dark:bg-neutral-800 shadow-sm rounded-lg text-[9px] font-bold uppercase tracking-wider text-neutral-800 dark:text-white">This Week</button>
                <button className="px-3.5 py-1.5 text-neutral-400 dark:text-neutral-500 text-[9px] font-bold uppercase tracking-wider">Historical</button>
              </div>
            </div>

            <div className="flex-1 -mx-6 -mb-2 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#888888', fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      fontSize: '11px',
                      background: 'rgba(23, 23, 23, 0.95)',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-200/10 shadow-sm text-neutral-600 dark:text-neutral-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Total Scans</p>
              <p className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">{totalScans || 24}</p>
              <p className="text-[10px] text-neutral-400 mt-1">Processed successfully</p>
            </div>
          </div>

          <div className="glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-red-500/5 dark:bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/10 shadow-sm text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">High-Confidence Matches</p>
              <p className="text-3xl font-extrabold tracking-tight text-red-650 mt-1">{aiScans || 8}</p>
              <p className="text-[10px] text-neutral-400 mt-1">{detectionRate || 33}% overall match rate</p>
            </div>
          </div>

          <div className="glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/10 shadow-sm text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Avg Confidence</p>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-600 mt-1">{avgConfidence || 87}%</p>
              <p className="text-[10px] text-neutral-400 mt-1">Precision grade accuracy</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="glass-card border border-neutral-200/40 dark:border-neutral-850 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
            Console Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/detection')}
              className="px-6 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              Analyze Content <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="px-6 py-3.5 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-all hover:scale-105 active:scale-95"
            >
              Review History
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="px-6 py-3.5 border border-neutral-200 dark:border-neutral-850 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-all hover:scale-105 active:scale-95"
            >
              Configure Settings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
