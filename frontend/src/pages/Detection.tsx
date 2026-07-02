import {
  AlertTriangle,
  CheckCircle,
  Download,
  Lightbulb,
  LogOut,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { detectAiContent, DetectionResponse } from '../api/client';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';

function scoreLabel(score: number) {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function clampPercent(value: number) {
  return Math.round(Math.min(100, Math.max(0, value * 100)));
}

function buildInsights(result: DetectionResponse) {
  const insights: string[] = [];

  if (result.metrics.consistency >= 0.7) {
    insights.push('The content stays highly consistent in structure and tone, which is common in AI-written output.');
  } else if (result.metrics.consistency <= 0.4) {
    insights.push('The content shows more variation, which is more typical of human writing.');
  } else {
    insights.push('The content has moderate structural consistency, so the detector treats the result as mixed.');
  }

  if (result.metrics.burstiness <= 0.45) {
    insights.push('Low burstiness suggests the sentence rhythm is too even, a pattern often seen in generated text.');
  } else {
    insights.push('Uneven burstiness adds natural variation, which reduces the AI signature.');
  }

  if (result.metrics.perplexity <= 0.45) {
    insights.push('Lower perplexity indicates the wording is more predictable and model-like.');
  }

  if (result.patterns.length > 0) {
    insights.push(`Observed patterns: ${result.patterns.slice(0, 3).join(', ')}.`);
  }

  return insights;
}

export default function Detection() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [detectorText, setDetectorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = detectorText.length;
  const wordCount = detectorText.trim() ? detectorText.trim().split(/\s+/).length : 0;
  const insights = useMemo(() => (detectionResult ? buildInsights(detectionResult) : []), [detectionResult]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
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
      setError(null);

      // Save to history
      const record = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text: detectorText,
        preview: detectorText.substring(0, 150),
        aiProbability: res.aiProbability,
        confidenceScore: res.confidenceScore,
        metrics: res.metrics,
        analysis: res.analysis,
        patterns: res.patterns,
      };

      const existing = localStorage.getItem('detection_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(record);
      // Keep only last 100 records
      if (history.length > 100) {
        history.pop();
      }
      localStorage.setItem('detection_history', JSON.stringify(history));
    } catch (analysisError: any) {
      setError(analysisError?.message || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearDetector = () => {
    setDetectorText('');
    setDetectionResult(null);
    setError(null);
  };

  const downloadReport = () => {
    if (!detectionResult) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    const now = new Date();
    const fileName = `ai-detection-report-${now.toISOString().replace(/[:.]/g, '-')}.pdf`;
    const textSnippet = detectorText.trim() || 'No source text available.';

    let cursorY = 54;

    const addSectionTitle = (label: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(label.toUpperCase(), margin, cursorY);
      cursorY += 16;
    };

    const addParagraph = (text: string, fontSize = 10, gap = 10) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, cursorY);
      cursorY += lines.length * (fontSize + 2) + gap;
    };

    doc.setFillColor(23, 23, 23);
    doc.roundedRect(margin, 28, contentWidth, 88, 18, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AI Detection Report', margin + 22, 62);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${now.toLocaleString()}`, margin + 22, 82);
    doc.text(`AI probability: ${clampPercent(detectionResult.aiProbability)}%`, margin + 22, 100);
    doc.setTextColor(23, 23, 23);

    cursorY = 142;
    addSectionTitle('Detection Summary');
    addParagraph(`Risk level: ${scoreLabel(detectionResult.aiProbability)}. Confidence: ${clampPercent(detectionResult.confidenceScore)}%.`);
    addParagraph(`Perplexity: ${clampPercent(detectionResult.metrics.perplexity)}%. Burstiness: ${clampPercent(detectionResult.metrics.burstiness)}%. Consistency: ${clampPercent(detectionResult.metrics.consistency)}%.`);

    addSectionTitle('Why It Looks AI Generated');
    insights.forEach((item) => {
      addParagraph(`• ${item}`, 10, 4);
    });

    addSectionTitle('Analysis');
    addParagraph(detectionResult.analysis, 10, 12);

    if (detectionResult.patterns.length > 0) {
      addSectionTitle('Observed Patterns');
      addParagraph(detectionResult.patterns.map((pattern) => `• ${pattern}`).join('\n'), 10, 12);
    }

    addSectionTitle('Source Text Preview');
    addParagraph(textSnippet.substring(0, 1200), 10, 10);

    doc.save(fileName);
  };

  const riskLevel = detectionResult ? scoreLabel(detectionResult.aiProbability) : null;
  
  // High, Medium, Low styles configured natively in code
  const riskStyles = {
    High: {
      border: 'border-red-200/50 dark:border-red-950/20',
      bg: 'bg-red-50/50 dark:bg-red-950/10',
      text: 'text-red-650 dark:text-red-400',
      progress: '#ef4444'
    },
    Medium: {
      border: 'border-amber-200/50 dark:border-amber-950/20',
      bg: 'bg-amber-50/50 dark:bg-amber-950/10',
      text: 'text-amber-650 dark:text-amber-400',
      progress: '#f59e0b'
    },
    Low: {
      border: 'border-emerald-200/50 dark:border-emerald-950/20',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
      text: 'text-emerald-650 dark:text-emerald-400',
      progress: '#10b981'
    }
  }[riskLevel || 'Low'];

  return (
    <div className="flex bg-neutral-50/40 dark:bg-[#070707] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-300 w-full">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col w-full">
        {/* Header */}
        <div className="border-b border-neutral-200/40 dark:border-neutral-800/40 bg-white/70 dark:bg-neutral-950/70 backdrop-blur px-8 py-6 flex items-center justify-between z-15">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white">AI Content Detector</h1>
            <p className="text-xs text-neutral-550 dark:text-neutral-400 font-semibold mt-1">Analyze text for AI-generated patterns and entropy signatures</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadReport}
              disabled={!detectionResult}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-200 transition"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-950/20 text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-4.5 py-2.5 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Scroll Container */}
        <div className="flex-1 overflow-y-auto px-8 py-8 w-full mb-12">
          <div className="max-w-4xl mx-auto space-y-8 w-full">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 w-full"
            >
              <div className="w-full">
                <label className="block text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-3">
                  Enter text to analyze
                </label>
                <div className="relative rounded-2xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 overflow-hidden shadow-sm hover:border-neutral-300 dark:hover:border-neutral-800 transition">
                  <textarea
                    value={detectorText}
                    onChange={(e) => setDetectorText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAnalyze();
                      }
                    }}
                    placeholder="Paste or type your text here (minimum 10 characters)..."
                    className="w-full h-56 p-5 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-450 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Info and Stats */}
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                <div className="flex items-center gap-4">
                  <span>{charCount} characters</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </div>
                {charCount >= 10 && <span className="text-emerald-600 dark:text-emerald-400">✓ Ready to analyze</span>}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 rounded-2xl border border-red-200/50 dark:border-red-950/20 bg-red-50/50 dark:bg-red-950/10 p-4"
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-650 mt-0.5" />
                  <p className="text-xs font-semibold text-red-750 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || charCount < 10}
                  className="px-6 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-xl font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                >
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button
                  onClick={clearDetector}
                  className="px-6 py-3.5 border border-neutral-250 dark:border-neutral-850 text-neutral-600 dark:text-neutral-350 rounded-xl font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-all hover:scale-105 active:scale-95"
                >
                  Clear
                </button>
              </div>
            </motion.div>

            {/* Results Section */}
            {detectionResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 w-full"
              >
                {/* Risk Card */}
                <div className={`rounded-3xl border-2 p-8 ${riskStyles.border} ${riskStyles.bg} relative overflow-hidden`}>
                  <div className="flex items-center gap-3 mb-4">
                    {riskLevel === 'High' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5" style={{ color: riskLevel === 'Medium' ? '#f59e0b' : '#10b981' }} />
                    )}
                    <span className={`font-bold text-xs uppercase tracking-widest ${riskStyles.text}`}>
                      {riskLevel} AI Probability
                    </span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-5xl font-display font-black text-neutral-900 dark:text-white">
                      {clampPercent(detectionResult.aiProbability)}%
                    </p>
                    <div className="h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${clampPercent(detectionResult.aiProbability)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ backgroundColor: riskStyles.progress }}
                        className="h-full rounded-full"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                      Confidence Level: {clampPercent(detectionResult.confidenceScore)}%
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Key Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 p-6 bg-white dark:bg-neutral-950 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Perplexity</p>
                        <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{clampPercent(detectionResult.metrics.perplexity)}%</p>
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-4 leading-relaxed font-semibold">Predictability of vocabulary patterns</p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 p-6 bg-white dark:bg-neutral-950 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Burstiness</p>
                        <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{clampPercent(detectionResult.metrics.burstiness)}%</p>
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-4 leading-relaxed font-semibold">Sentence rhythm and spacing variation</p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 p-6 bg-white dark:bg-neutral-950 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Consistency</p>
                        <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{clampPercent(detectionResult.metrics.consistency)}%</p>
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-4 leading-relaxed font-semibold">Structure uniformity across the document</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="text-xs font-bold text-neutral-455 dark:text-neutral-500 uppercase tracking-widest">Diagnostic Insights</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {insights.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-5 shadow-sm">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="rounded-[2rem] border border-neutral-200/40 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-8 space-y-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">Detailed Diagnostic Analysis</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed font-semibold">{detectionResult.analysis}</p>
                  
                  {detectionResult.patterns.length > 0 && (
                    <div className="pt-6 border-t border-neutral-200/40 dark:border-neutral-800/40 space-y-3">
                      <p className="text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">Observed Signatures</p>
                      <div className="flex flex-wrap gap-2">
                        {detectionResult.patterns.map((pattern, index) => (
                          <span key={index} className="px-3.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!detectionResult && !loading && (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-6 shadow-sm border border-neutral-200/10">
                  <Sparkles className="h-6 w-6 text-neutral-450 dark:text-neutral-500 animate-pulse" />
                </div>
                <p className="text-neutral-500 dark:text-neutral-450 text-sm font-semibold">Enter text and click "Analyze Text" to generate a diagnostic report</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
