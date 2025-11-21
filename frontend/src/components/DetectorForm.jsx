import React, { useState } from 'react';
import { Search, FileText, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const DetectorForm = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError('Please enter at least 10 characters for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/detect/bulk-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      
      setResult({
        isAiGenerated: data.probability >= 50,
        probability: data.probability,
        metrics: data.metrics || {},
        patterns: data.patterns || [],
        analysis: data.analysis || 'No analysis available'
      });
    } catch (err) {
      setError('Failed to analyze content. Please make sure the backend is running and API key is configured.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMetricColor = (value) => {
    if (value >= 70) return 'text-red-400';
    if (value >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <motion.div
        className="glass-panel border-white/5 p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 space-y-3">
          <label htmlFor="content-input" className="block text-sm uppercase tracking-[0.4em] text-mist/60">
            Add text
          </label>
          <textarea
            id="content-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste up to 5,000 characters for detection..."
            className="w-full h-52 sm:h-64 rounded-2xl bg-carbon/90 border border-white/10 text-white p-4 text-base placeholder:text-mist/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all resize-none"
            maxLength={5000}
          />
          <div className="flex flex-wrap gap-3 text-xs text-mist/70">
            <span>{text.length}/5000 chars</span>
            <span>{text.split(' ').filter(Boolean).length} words</span>
          </div>
        </div>

        {error && (
          <motion.div
            className="mb-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={handleAnalyze}
          disabled={!text.trim() || text.trim().length < 10 || isAnalyzing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-space text-sm tracking-wide disabled:opacity-40"
          whileHover={{ scale: text.trim() && text.trim().length >= 10 ? 1.02 : 1 }}
          whileTap={{ scale: text.trim() && text.trim().length >= 10 ? 0.98 : 1 }}
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 border-2 border-black/40 border-t-transparent rounded-full animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Run detector
            </>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            className="mt-6 glass-panel border-white/5 p-6 sm:p-8 space-y-6"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {result.isAiGenerated ? (
                  <AlertCircle className="h-5 w-5 text-warning" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                <div>
                  <p className="text-white font-space text-lg">
                    {result.isAiGenerated ? 'AI signature detected' : 'Reads as human'}
                  </p>
                  <p className="text-sm text-mist/70">Confidence {result.probability}%</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-carbon overflow-hidden">
                <motion.div
                  className={`h-full ${result.isAiGenerated ? 'bg-warning' : 'bg-success'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.probability}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            {result.metrics && Object.keys(result.metrics).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {result.metrics.perplexity !== undefined && (
                  <div className="soft-border p-4 space-y-2">
                    <div className="flex items-center gap-2 text-mist/70">
                      <TrendingUp className="h-4 w-4" />
                      Perplexity
                    </div>
                    <p className={`text-3xl font-space ${getMetricColor(result.metrics.perplexity)}`}>{result.metrics.perplexity}%</p>
                    <p className="text-xs text-mist/60">Lower reads human</p>
                  </div>
                )}
                {result.metrics.burstiness !== undefined && (
                  <div className="soft-border p-4 space-y-2">
                    <div className="flex items-center gap-2 text-mist/70">
                      <Zap className="h-4 w-4" />
                      Burstiness
                    </div>
                    <p className={`text-3xl font-space ${getMetricColor(result.metrics.burstiness)}`}>{result.metrics.burstiness}%</p>
                    <p className="text-xs text-mist/60">Variation spread</p>
                  </div>
                )}
                {result.metrics.consistency !== undefined && (
                  <div className="soft-border p-4 space-y-2">
                    <div className="flex items-center gap-2 text-mist/70">
                      <TrendingDown className="h-4 w-4" />
                      Consistency
                    </div>
                    <p className={`text-3xl font-space ${getMetricColor(result.metrics.consistency)}`}>{result.metrics.consistency}%</p>
                    <p className="text-xs text-mist/60">Pattern stability</p>
                  </div>
                )}
              </div>
            )}

            {result.patterns && result.patterns.length > 0 && (
              <div className="soft-border p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-mist/60 mb-3">Patterns</p>
                <div className="flex flex-wrap gap-2">
                  {result.patterns.map((pattern, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="soft-border p-4 flex gap-3">
              <FileText className="h-4 w-4 text-accent mt-1" />
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-mist/60 mb-2">Summary</p>
                <p className="text-sm text-mist/80 leading-relaxed">{result.analysis}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetectorForm;