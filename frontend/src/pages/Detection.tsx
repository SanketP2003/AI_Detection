import {
  AlertTriangle,
  CheckCircle,
  Download,
  Lightbulb,
  LogOut,
  Sparkles,
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
  const riskBgColor = riskLevel === 'High' ? '#fca5a5' : riskLevel === 'Medium' ? '#fcd34d' : '#a7f3d0';
  const riskTextColor = riskLevel === 'High' ? '#991b1b' : riskLevel === 'Medium' ? '#92400e' : '#166534';
  const riskProgressColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-white px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">AI Content Detector</h1>
            <p className="text-sm text-neutral-500 mt-1">Analyze text for AI-generated patterns</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadReport}
              disabled={!detectionResult}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-neutral-900 transition"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2 text-sm font-medium transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                  Enter text to analyze
                </label>
                <div className="relative rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-sm hover:border-neutral-300 transition">
                  <textarea
                    value={detectorText}
                    onChange={(e) => setDetectorText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAnalyze();
                      }
                    }}
                    placeholder="Paste or type your text here (minimum 10 characters)..."
                    className="w-full h-56 p-4 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Info and Stats */}
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-4">
                  <span>{charCount} characters</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </div>
                {charCount >= 10 && <span className="text-green-600 font-medium">✓ Ready to analyze</span>}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || charCount < 10}
                  className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button
                  onClick={clearDetector}
                  className="px-6 py-3 border border-neutral-200 rounded-lg font-medium text-sm text-neutral-900 hover:bg-neutral-50 transition"
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
                className="space-y-6"
              >
                {/* Risk Card */}
                <div
                  className="rounded-lg border-2 p-6"
                  style={{
                    borderColor: riskBgColor,
                    backgroundColor: `${riskBgColor}15`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {riskLevel === 'High' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5" style={{ color: riskLevel === 'Medium' ? '#f59e0b' : '#22c55e' }} />
                    )}
                    <span className="font-semibold text-sm" style={{ color: riskTextColor }}>
                      {riskLevel} AI Probability
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-4xl font-bold text-neutral-900">{clampPercent(detectionResult.aiProbability)}%</p>
                    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${clampPercent(detectionResult.aiProbability)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ backgroundColor: riskProgressColor }}
                        className="h-full"
                      />
                    </div>
                    <p className="text-xs text-neutral-500">Confidence: {clampPercent(detectionResult.confidenceScore)}%</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Perplexity</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">{clampPercent(detectionResult.metrics.perplexity)}%</p>
                      <p className="text-xs text-neutral-500 mt-2">Predictability of wording</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Burstiness</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">{clampPercent(detectionResult.metrics.burstiness)}%</p>
                      <p className="text-xs text-neutral-500 mt-2">Sentence rhythm variation</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Consistency</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">{clampPercent(detectionResult.metrics.consistency)}%</p>
                      <p className="text-xs text-neutral-500 mt-2">Structure uniformity</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-semibold text-neutral-900">Why this result</h3>
                  </div>
                  <div className="space-y-2">
                    {insights.map((item, index) => (
                      <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-sm text-neutral-700 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 space-y-4">
                  <h3 className="font-semibold text-neutral-900">Detailed Analysis</h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">{detectionResult.analysis}</p>
                  
                  {detectionResult.patterns.length > 0 && (
                    <div className="pt-4 border-t border-neutral-200 space-y-3">
                      <p className="text-sm font-medium text-neutral-900">Observed Patterns</p>
                      <div className="flex flex-wrap gap-2">
                        {detectionResult.patterns.map((pattern, index) => (
                          <span key={index} className="px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs text-neutral-700">
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
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-neutral-400" />
                  </div>
                </div>
                <p className="text-neutral-600 text-sm">Enter text and click "Analyze Text" to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
