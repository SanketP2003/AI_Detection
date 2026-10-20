import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle, Button, Badge } from '../components/CommonUI';
import jsPDF from 'jspdf';

import { useAuth } from '../context/AuthContext';
import { getUserDetections } from '../api/client';

interface ReportItem {
  id: string;
  title: string;
  score?: number;
  dateText: string;
  interpretation?: string;
  signals?: {
    predictability: number;
    variation: number;
    repetition: number;
  };
  text: string;
  fullData?: any;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const loadReports = async () => {
      const items: ReportItem[] = [];

      // 1. Local history
      try {
        const local = localStorage.getItem('detection_history');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((item: any, i: number) => {
              const prob =
                typeof item.aiProbability === 'number'
                  ? Math.round(item.aiProbability * 100)
                  : typeof item.score === 'number'
                  ? Math.round(item.score)
                  : undefined;

              const metrics = item.metrics;
              const hasMetrics =
                metrics != null &&
                typeof metrics.perplexity === 'number' &&
                typeof metrics.burstiness === 'number' &&
                typeof metrics.consistency === 'number';

              const signals = hasMetrics
                ? {
                    predictability: Math.round(metrics.perplexity * 100),
                    variation: Math.round(metrics.burstiness * 100),
                    repetition: Math.round(metrics.consistency * 100),
                  }
                : undefined;

              const rawDate = item.timestamp;
              let dateText = 'Recent';
              if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  dateText = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                }
              }

              items.push({
                id: item.id || `rep-local-${i}`,
                title: item.preview || (item.text ? item.text.slice(0, 50) + '…' : 'Analysis Report'),
                score: prob,
                dateText,
                interpretation:
                  typeof item.analysis === 'string' && item.analysis.trim()
                    ? item.analysis.trim()
                    : undefined,
                signals,
                text: item.text || item.contentPreview || '',
                fullData: item,
              });
            });
          }
        }
      } catch (e) {
        console.warn('Failed reading history for reports:', e);
      }

      // 2. Backend detections if authenticated
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

              const metrics = parsedResult.metrics;
              const hasMetrics =
                metrics != null &&
                typeof metrics.perplexity === 'number' &&
                typeof metrics.burstiness === 'number' &&
                typeof metrics.consistency === 'number';

              const signals = hasMetrics
                ? {
                    predictability: Math.round(metrics.perplexity * 100),
                    variation: Math.round(metrics.burstiness * 100),
                    repetition: Math.round(metrics.consistency * 100),
                  }
                : undefined;

              const rawDate = b.createdAt;
              let dateText = 'Recent';
              if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  dateText = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                }
              }

              items.unshift({
                id: `rep-be-${b.id}`,
                title: b.contentPreview || 'Analysis Report',
                score: prob,
                dateText,
                interpretation:
                  typeof parsedResult.analysis === 'string' && parsedResult.analysis.trim()
                    ? parsedResult.analysis.trim()
                    : undefined,
                signals,
                text: b.contentPreview || '',
                fullData: {
                  ...parsedResult,
                  contentPreview: b.contentPreview,
                  score: prob,
                },
              });
            });
          }
        } catch (e) {
          console.warn('Failed fetching backend detections for reports:', e);
        }
      }

      // Deduplicate by title
      const unique = items.filter((v, i, a) => a.findIndex((t) => t.title === v.title) === i);
      setReports(unique);
    };

    loadReports();
  }, [user]);

  const activeReport = reports[selectedIdx] || reports[0] || null;

  const handleDownloadPDF = () => {
    if (!activeReport) return;
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');

      // Top Header
      doc.setFillColor(23, 77, 59);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AI VERIFY — ANALYSIS REPORT', 20, 16);

      // Metadata
      doc.setTextColor(32, 36, 31);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()} · ${activeReport.dateText}`, 20, 36);

      // Score Callout
      doc.setFillColor(239, 243, 231);
      doc.roundedRect(20, 48, 170, 34, 3, 3, 'F');

      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 77, 59);
      const scoreStr = typeof activeReport.score === 'number' ? `${activeReport.score}%` : '—';
      doc.text(scoreStr, 28, 70);

      doc.setFontSize(11);
      doc.setTextColor(32, 36, 31);
      const verdict =
        typeof activeReport.score === 'number'
          ? activeReport.score >= 60
            ? 'AI-Associated Patterns Likely'
            : activeReport.score <= 35
            ? 'Mostly Human Patterns'
            : 'Mixed Signals'
          : 'Score Unavailable';
      doc.text(verdict, 60, 64);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 107);
      doc.text(
        typeof activeReport.score === 'number'
          ? 'Model pattern score — not definitive proof of authorship.'
          : 'This item was not evaluated with a numerical pattern score.',
        60,
        72
      );

      // Document Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 36, 31);
      doc.text(activeReport.title, 20, 100);

      // Interpretation
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 36, 31);
      doc.text('Linguistic Interpretation', 20, 115);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 85, 80);
      const interpText =
        activeReport.interpretation && activeReport.interpretation.trim()
          ? activeReport.interpretation.trim()
          : 'No analysis details were returned for this scan.';
      const splitInterp = doc.splitTextToSize(interpText, 170);
      doc.text(splitInterp, 20, 123);

      // Signal Breakdown (if available)
      if (activeReport.signals) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(32, 36, 31);
        doc.text('Contributing Signals', 20, 155);

        const sigRows = [
          ['Language Predictability', `${activeReport.signals.predictability}%`],
          ['Sentence Variation', `${activeReport.signals.variation}%`],
          ['Structural Repetition', `${activeReport.signals.repetition}%`],
        ];

        let curY = 165;
        sigRows.forEach(([sName, sVal]) => {
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 113, 107);
          doc.text(sName, 20, curY);
          doc.text(sVal, 160, curY);
          curY += 8;
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('AI Verify • Transparent AI Pattern Detection • https://github.com/SanketP2003/AI_Detection', 20, 285);

      const scoreTag = typeof activeReport.score === 'number' ? `${activeReport.score}` : 'unscored';
      doc.save(`ai-verify-report-${scoreTag}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  const handleOpenAnalysis = () => {
    if (!activeReport) return;
    const words = activeReport.text.trim() ? activeReport.text.trim().split(/\s+/).length : 0;
    const payload = {
      text: activeReport.text,
      words,
      chars: activeReport.text.length,
      aiProbability: typeof activeReport.score === 'number' ? activeReport.score / 100 : 0,
      score: typeof activeReport.score === 'number' ? activeReport.score : 0,
      signals: activeReport.signals,
      metrics: activeReport.signals
        ? {
            perplexity: activeReport.signals.predictability / 100,
            burstiness: activeReport.signals.variation / 100,
            consistency: activeReport.signals.repetition / 100,
          }
        : undefined,
      analysis: activeReport.interpretation,
      analyzedAt: activeReport.dateText,
    };
    localStorage.setItem('latest_analysis', JSON.stringify(payload));
    navigate('/detection?view=results');
  };

  return (
    <div className="page">
      <PageTitle
        title="Reports"
        copy="Create clear, shareable records of your analysis findings."
        action={
          <Button onClick={() => navigate('/detection')}>
            ＋ New analysis
          </Button>
        }
      />

      <div className="report-layout">
        {/* Left Column: Saved Reports */}
        <section className="report-list">
          <span className="eyebrow">SAVED REPORTS</span>
          {reports.map((r, i) => {
            const hasScore = typeof r.score === 'number';
            const tone = !hasScore
              ? 'neutral'
              : r.score! >= 60
              ? 'amber'
              : r.score! <= 35
              ? 'green'
              : 'neutral';

            return (
              <button
                type="button"
                className={i === selectedIdx ? 'active' : ''}
                key={r.id}
                onClick={() => setSelectedIdx(i)}
              >
                <span className="doc-icon">▤</span>
                <span>
                  <b>{r.title}</b>
                  <small>PDF report · {r.dateText}</small>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: hasScore ? 'var(--ink)' : 'var(--muted)' }}>
                  {hasScore ? `${r.score}%` : '—'}
                </span>
              </button>
            );
          })}
        </section>

        {/* Right Column: Forensic Paper Preview */}
        <section className="report-preview">
          {activeReport ? (
            <>
              {/* Top Action Bar for quick download / open */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  maxWidth: '510px',
                  margin: '0 auto 20px auto',
                }}
              >
                <span className="eyebrow" style={{ margin: 0 }}>
                  DOCUMENT PREVIEW
                </span>
                <div className="button-row">
                  <Button
                    kind="secondary"
                    disabled={typeof activeReport.score !== 'number'}
                    onClick={handleOpenAnalysis}
                    title={typeof activeReport.score !== 'number' ? 'Score unavailable' : undefined}
                  >
                    Open analysis
                  </Button>
                  <Button onClick={handleDownloadPDF}>Download PDF</Button>
                </div>
              </div>

              <div className="paper">
                <div className="paper-brand">
                  <b>AI Verify</b>
                  <span>ANALYSIS REPORT</span>
                </div>
                <p className="paper-date">
                  Generated {activeReport.dateText} · Transparent assessment
                </p>
                <h2>{activeReport.title}</h2>
                <div className="paper-score">
                  <strong>
                    {typeof activeReport.score === 'number' ? `${activeReport.score}%` : '—'}
                  </strong>
                  <span>
                    {typeof activeReport.score === 'number' ? '/ 100 model score' : 'Score unavailable'}
                    <br />
                    <b>
                      {typeof activeReport.score === 'number'
                        ? activeReport.score >= 60
                          ? 'AI-associated patterns likely'
                          : activeReport.score <= 35
                          ? 'Mostly human patterns'
                          : 'Mixed signals'
                        : 'Not scored'}
                    </b>
                  </span>
                </div>
                <h3>Interpretation</h3>
                <p>
                  {activeReport.interpretation && activeReport.interpretation.trim()
                    ? activeReport.interpretation.trim()
                    : 'No analysis details were returned for this scan.'}
                </p>
                {activeReport.signals ? (
                  <div className="paper-bars">
                    <i style={{ width: `${activeReport.signals.predictability}%` }} />
                    <i style={{ width: `${activeReport.signals.variation}%` }} />
                    <i style={{ width: `${activeReport.signals.repetition}%` }} />
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '16px 0 0' }}>
                    Signal breakdown unavailable for this analysis.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="empty">
              <span>▤</span>
              <h3>No reports available</h3>
              <p>Run a new analysis to generate your first report.</p>
              <div style={{ marginTop: '16px' }}>
                <Button onClick={() => navigate('/detection')}>Start an analysis</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
