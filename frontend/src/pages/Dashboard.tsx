import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { useAuth } from '../context/AuthContext';

const data = [
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
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Avg AI Probability</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex bg-white min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-neutral-500 font-medium">AI Detection Analytics & Overview</p>
            {user?.username && (
              <p className="text-xs text-neutral-400 mt-1">Logged in as: {user.username}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* AI Probability Card */}
          <div className="lg:col-span-1 bg-white border border-neutral-100 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[360px] shadow-sm">
            <div className="self-start mb-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              Weekly Average
            </div>
            <CircularProgress percentage={72} />
            <div className="mt-auto" />
          </div>

          {/* Confidence Trends Card */}
          <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-3xl p-8 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Detection Trends</div>
              <div className="flex p-1 bg-neutral-50 rounded-lg border border-neutral-100">
                <button className="px-3 py-1 bg-white shadow-sm rounded-md text-[10px] font-bold uppercase tracking-wider">This Week</button>
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

        {/* Statistics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Total Scans</p>
            <p className="text-4xl font-black">24</p>
            <p className="text-xs text-neutral-500 mt-2">This month</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">AI Content Found</p>
            <p className="text-4xl font-black text-red-600">8</p>
            <p className="text-xs text-neutral-500 mt-2\">33.3% detection rate</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Avg Confidence</p>
            <p className="text-4xl font-black text-green-600">87%</p>
            <p className="text-xs text-neutral-500 mt-2">High accuracy</p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4\">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/detection')}
              className="px-6 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-900 transition-colors"
            >
              New Detection
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="px-6 py-2 border border-neutral-200 rounded-lg text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              View History
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="px-6 py-2 border border-neutral-200 rounded-lg text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Settings
            </button>
          </div>
        </section>
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
