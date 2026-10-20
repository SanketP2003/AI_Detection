import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDetections } from '../api/client';
import { motion } from 'motion/react';

import UsageStrip from '../components/UsageStrip';

interface ScanItem {
  id: string;
  title: string;
  type: string;
  scoreText: string;
  scoreValue?: number;
  verdict: string;
  dateText: string;
  fullData?: any;
}


const WAVE_BARS = [
  { height: 35, duration: 1.2, delay: 0.1 },
  { height: 55, duration: 1.4, delay: 0.3 },
  { height: 75, duration: 1.1, delay: 0 },
  { height: 95, duration: 1.5, delay: 0.2 },
  { height: 65, duration: 1.3, delay: 0.4 },
  { height: 100, duration: 1.6, delay: 0.1 },
  { height: 70, duration: 1.2, delay: 0.5 },
  { height: 85, duration: 1.4, delay: 0.2 },
  { height: 60, duration: 1.1, delay: 0.3 },
  { height: 45, duration: 1.5, delay: 0.4 },
  { height: 30, duration: 1.3, delay: 0.2 },
];

function formatScanDate(ts?: string | number | Date): string {
  if (!ts) return 'Recent';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'Recent';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allScans, setAllScans] = useState<ScanItem[]>([]);
  const [realScans, setRealScans] = useState<ScanItem[]>([]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  useEffect(() => {
    const loadScans = async () => {
      const items: ScanItem[] = [];

      // 1. Try local storage history
      try {
        const local = localStorage.getItem('detection_history');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const prob =
                typeof p.aiProbability === 'number'
                  ? Math.round(p.aiProbability * 100)
                  : typeof p.score === 'number'
                  ? Math.round(p.score)
                  : undefined;
              const hasScore = typeof prob === 'number';
              items.push({
                id: String(p.id || Math.random()),
                title: p.preview || p.contentPreview || (p.text ? p.text.slice(0, 60) + '…' : 'Text analysis'),
                type: 'Text',
                scoreText: hasScore ? `${prob}%` : '—',
                scoreValue: prob,
                verdict: hasScore
                  ? prob >= 65
                    ? 'AI patterns likely'
                    : prob <= 30
                    ? 'Mostly human patterns'
                    : 'Mixed signals'
                  : 'Not scored',
                dateText: formatScanDate(p.timestamp),
                fullData: p,
              });
            });
          }
        }
      } catch (err) {
        console.warn('Error reading local history:', err);
      }

      // 2. Fetch backend detections if authenticated
      if (user?.username) {
        try {
          const backend = await getUserDetections();
          if (Array.isArray(backend) && backend.length > 0) {
            backend.forEach((b) => {
              let parsedResult: any = {};
              try {
                parsedResult = JSON.parse(b.result);
              } catch {}
              const prob =
                typeof parsedResult.aiProbability === 'number'
                  ? Math.round(parsedResult.aiProbability * 100)
                  : typeof b.confidence === 'number'
                  ? Math.round(b.confidence)
                  : undefined;
              const hasScore = typeof prob === 'number';

              items.unshift({
                id: String(b.id),
                title: b.contentPreview || 'Scan snippet',
                type: 'Text',
                scoreText: hasScore ? `${prob}%` : '—',
                scoreValue: prob,
                verdict: hasScore
                  ? prob >= 65
                    ? 'AI patterns likely'
                    : prob <= 30
                    ? 'Mostly human patterns'
                    : 'Mixed signals'
                  : 'Not scored',
                dateText: formatScanDate(b.createdAt),
                fullData: {
                  ...parsedResult,
                  contentPreview: b.contentPreview,
                  aiProbability: hasScore ? prob / 100 : undefined,
                  confidenceScore:
                    typeof parsedResult.confidenceScore === 'number' ? parsedResult.confidenceScore : undefined,
                },
              });
            });
          }
        } catch (err) {
          console.warn('Backend history sync:', err);
        }
      }

      // Filter out test scripts if they were saved to history
      const meaningfulItems = items.filter(
        (it) => it.title && !it.title.startsWith('Furthermore') && !it.title.startsWith('The ongoing')
      );

      setAllScans(meaningfulItems);
      setRealScans(meaningfulItems.slice(0, 3));
    };

    loadScans();
  }, [user]);

  const totalAnalyses = allScans.length;
  const scoredAnalyses = allScans.filter((s) => typeof s.scoreValue === 'number');
  const avgScore =
    scoredAnalyses.length > 0
      ? Math.round(scoredAnalyses.reduce((acc, s) => acc + s.scoreValue!, 0) / scoredAnalyses.length)
      : null;

  const openScan = (scan: ScanItem) => {
    if (scan.fullData) {
      localStorage.setItem('latest_analysis', JSON.stringify(scan.fullData));
    }
    navigate('/detection?view=results');
  };

  const username =
    user?.fullName ||
    (user?.username && !user.username.startsWith('user_') ? user.username : 'Sanket');

  return (
    <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            {todayFormatted}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {greeting}, {username}.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Review recent findings or start a new content analysis.
          </p>
          <UsageStrip />
        </div>

        <button
          type="button"
          onClick={() => navigate('/detection')}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#174d3b] hover:bg-[#123e2f] text-white text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <span>+ New analysis</span>
        </button>
      </div>

      {/* Hero Green Verdant Banner Card with Waveform Animation */}
      <div className="rounded-[24px] p-8 sm:p-10 lg:p-12 bg-[#174d3b] text-white shadow-lg relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-4 z-10">
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#dce8d8] text-[#174d3b]">
            ANALYSIS WORKSPACE
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white leading-tight">
            Examine content with context, not conclusions.
          </h2>
          <p className="text-[#d5e1da] text-xs sm:text-sm leading-relaxed max-w-xl">
            Surface language patterns, inspect model signals, and build a more informed assessment in one focused workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/detection')}
              className="px-5 py-2.5 rounded-lg bg-white text-[#174d3b] font-bold text-xs sm:text-sm hover:bg-neutral-100 transition shadow-sm active:scale-95"
            >
              Analyze text
            </button>
            <button
              type="button"
              onClick={() => navigate('/how-it-works')}
              className="px-5 py-2.5 rounded-lg border border-white/30 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition active:scale-95"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Right Animated Signal Waveform directly on the green banner */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-10 flex flex-col justify-center items-center lg:items-center z-10">
          <div className="flex items-end justify-center gap-2 h-28 sm:h-32 mb-4 w-full">
            {WAVE_BARS.map((bar, idx) => {
              const isLime = (idx + 1) % 3 === 0;
              return (
                <motion.span
                  key={idx}
                  animate={{
                    scaleY: [0.3, 1, 0.45, 1.1, 0.3],
                    opacity: [0.8, 1, 0.85, 1, 0.8],
                  }}
                  transition={{
                    duration: bar.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: bar.delay,
                  }}
                  style={{
                    height: `${bar.height}%`,
                    width: 7,
                    borderRadius: 9999,
                    backgroundColor: isLime ? '#d8e886' : '#89aa8c',
                    transformOrigin: 'bottom',
                  }}
                />
              );
            })}
          </div>
          <div className="text-center space-y-0.5">
            <p className="font-bold text-white text-sm tracking-wide">
              Signal analysis
            </p>
            <p className="text-[#b8cbc0] text-[11px]">
              Pattern-level evaluation
            </p>
          </div>
        </div>
      </div>

      {/* Honest Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#1e221f] border border-neutral-200/80 dark:border-neutral-800">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            TOTAL ANALYSES
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
            {totalAnalyses}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Recorded in workspace
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#1e221f] border border-neutral-200/80 dark:border-neutral-800">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            AVERAGE SCORE
          </span>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
            {avgScore != null ? `${avgScore}%` : '—'}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {avgScore != null ? 'Across scored analyses' : 'No scored analyses recorded'}
          </p>
        </div>
      </div>

      {/* Recent analyses section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              Recent analyses
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Continue where you left off.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            View all →
          </button>
        </div>

        {/* 3 Cards Grid or Honest Empty State */}
        {realScans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {realScans.map((scan) => {
              const val = scan.scoreValue;
              const hasScore = typeof val === 'number';

              const badgeBg = !hasScore
                ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                : val >= 60
                ? 'bg-[#fef3c7] text-[#b45309] dark:bg-[#3a3022] dark:text-[#e0aa60] border border-amber-200/60 dark:border-amber-900/60'
                : val <= 35
                ? 'bg-[#dcfce7] text-[#15803d] dark:bg-[#273c30] dark:text-[#86b99a] border border-emerald-200/60 dark:border-emerald-900/60'
                : 'bg-[#f1f5f9] text-[#475569] dark:bg-[#252a26] dark:text-[#a8aea7] border border-neutral-200/60 dark:border-neutral-700';

              return (
                <div
                  key={scan.id}
                  onClick={() => openScan(scan)}
                  className="p-5 rounded-xl bg-white dark:bg-[#1e221f] border border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
                >
                  <div>
                    {/* Card top row */}
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-[#dce8d8] dark:bg-[#253029] text-[#174d3b] dark:text-[#86b99a] flex items-center justify-center font-bold text-sm">
                        ¶
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                        {scan.scoreText}
                      </span>
                    </div>

                    {/* Title and Verdict */}
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-5 line-clamp-1">
                      {scan.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {scan.verdict}
                    </p>
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-neutral-100 dark:border-neutral-800/80 mt-5 pt-3 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{scan.type}</span>
                    <span>{scan.dateText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-white dark:bg-[#1e221f] border border-neutral-200/80 dark:border-neutral-800 text-center">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No recent analyses recorded
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Start an analysis to inspect language patterns and diagnostic signals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
