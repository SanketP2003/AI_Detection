import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { detectAiContent, saveUserDetection, DetectionResponse } from '../api/client';
import { PageTitle, Button, Badge, ScoreRing } from '../components/CommonUI';
import jsPDF from 'jspdf';
import UsageStrip from '../components/UsageStrip';
import Modal from '../components/Modal';

const SAMPLE_TEXT_HUMAN = `I started walking early that morning, before the coastal fog had burned away from the headlands. The damp sea salt was cold against my neck, and the gulls were wheeling over the tide pools with that sharp, discordant cry they only make when the swells get rough. It reminded me of grandfather's old timber skiff back in Maine—leaky, stubborn, but always buoyant enough to carry us through the rip.`;

const SAMPLE_TEXT_AI = `Furthermore, it is essential to recognize that comprehensive linguistic analysis provides substantial insight into structural methodologies. The implementation of automated natural language processing models optimizes document clarity by minimizing idiosyncratic variance. In summary, systematic evaluations demonstrate that uniform syntactic composition establishes consistent readability across organizational workflows.`;

const ANALYSIS_STEPS = [
  'Tokenizing text and preparing linguistic pipeline…',
  'Evaluating perplexity and lexical entropy…',
  'Calculating burstiness and sentence rhythm variance…',
  'Screening for algorithmic stylistic signatures…',
  'Synthesizing diagnostic verification report…',
];

interface UploadedDocument {
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
  format: string;
  extractedText: string;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  estimatedPages: number;
}

const SAMPLE_DOCUMENTS: UploadedDocument[] = [
  {
    name: 'Research_Abstract_Language_Models.pdf',
    sizeFormatted: '184 KB',
    sizeBytes: 188416,
    format: 'PDF Document (.pdf)',
    extractedText: `Comprehensive linguistic analysis provides substantial insight into structural methodologies. The implementation of automated natural language processing models optimizes document clarity by minimizing idiosyncratic variance. In summary, systematic evaluations demonstrate that uniform syntactic composition establishes consistent readability across organizational workflows. Furthermore, comparative benchmarks illustrate how algorithmic synthesis generates predictable lexical frequency distributions.`,
    wordCount: 52,
    charCount: 432,
    paragraphCount: 2,
    estimatedPages: 1,
  },
  {
    name: 'Field_Notes_Maine_Headlands.docx',
    sizeFormatted: '96 KB',
    sizeBytes: 98304,
    format: 'Word Document (.docx)',
    extractedText: `I started walking early that morning, before the coastal fog had burned away from the headlands. The damp sea salt was cold against my neck, and the gulls were wheeling over the tide pools with that sharp, discordant cry they only make when the swells get rough. It reminded me of grandfather's old timber skiff back in Maine—leaky, stubborn, but always buoyant enough to carry us through the rip.`,
    wordCount: 68,
    charCount: 421,
    paragraphCount: 1,
    estimatedPages: 1,
  },
];

interface AnalysisResultData {
  text: string;
  words: number;
  chars: number;
  aiProbability: number;
  confidenceScore?: number;
  score: number;
  metrics?: {
    perplexity?: number;
    burstiness?: number;
    consistency?: number;
  };
  signals?: {
    predictability?: number;
    variation?: number;
    repetition?: number;
  };
  analysis?: string;
  patterns?: string[];
  analyzedAt: string;
  documentInfo?: {
    name: string;
    format: string;
    sizeFormatted: string;
    pages: number;
    paragraphs: number;
  };
}

export default function Detection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'text' | 'document'>('text');
  const [detectorText, setDetectorText] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaModalData, setQuotaModalData] = useState<{ used: number; limit: number; resetsAt?: string }>({
    used: 20,
    limit: 20,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTextToAnalyze = activeTab === 'document' && uploadedDoc ? uploadedDoc.extractedText : detectorText;
  const charCount = currentTextToAnalyze.length;
  const wordCount = currentTextToAnalyze.trim() ? currentTextToAnalyze.trim().split(/\s+/).filter(Boolean).length : 0;

  // Multi-step progress animation when loading
  useEffect(() => {
    if (loading) {
      setAnalysisStep(0);
      const interval = setInterval(() => {
        setAnalysisStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 700);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Load from pending_demo_text, latest analysis or URL param on mount
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_demo_text');
      if (pending) {
        setDetectorText(pending);
        localStorage.removeItem('pending_demo_text');
        setActiveTab('text');
        setResult(null);
        return;
      }
    } catch {}

    const viewParam = searchParams.get('view');
    try {
      const stored = localStorage.getItem('latest_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.aiProbability === 'number' && (parsed.text || parsed.contentPreview)) {
          const prob = parsed.aiProbability;
          const score = typeof parsed.score === 'number' ? parsed.score : Math.round(prob * 100);

          let signals = parsed.signals;
          if (
            !signals &&
            parsed.metrics &&
            typeof parsed.metrics.perplexity === 'number' &&
            typeof parsed.metrics.burstiness === 'number' &&
            typeof parsed.metrics.consistency === 'number'
          ) {
            signals = {
              predictability: Math.round(parsed.metrics.perplexity * 100),
              variation: Math.round(parsed.metrics.burstiness * 100),
              repetition: Math.round(parsed.metrics.consistency * 100),
            };
          }

          const loadedResult: AnalysisResultData = {
            text: parsed.text || parsed.contentPreview || '',
            words: typeof parsed.words === 'number' ? parsed.words : (parsed.text ? parsed.text.trim().split(/\s+/).filter(Boolean).length : 0),
            chars: typeof parsed.chars === 'number' ? parsed.chars : (parsed.text ? parsed.text.length : 0),
            aiProbability: prob,
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : undefined,
            score,
            metrics: parsed.metrics ?? undefined,
            signals: signals ?? undefined,
            analysis: (typeof parsed.analysis === 'string' && parsed.analysis.trim()) ? parsed.analysis.trim() : undefined,
            patterns: Array.isArray(parsed.patterns) ? parsed.patterns : undefined,
            analyzedAt: parsed.analyzedAt || 'Recent',
            documentInfo: parsed.documentInfo ?? undefined,
          };

          if (viewParam === 'results') {
            setResult(loadedResult);
          }
          if (!detectorText && loadedResult.text) {
            setDetectorText(loadedResult.text);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load stored analysis:', e);
    }
  }, [searchParams]);

  const handleAnalyze = async () => {
    const textToScan = activeTab === 'document' && uploadedDoc ? uploadedDoc.extractedText : detectorText;
    const wCount = textToScan.trim() ? textToScan.trim().split(/\s+/).filter(Boolean).length : 0;
    const cCount = textToScan.length;

    if (!textToScan.trim() || cCount < 10) {
      setError(
        activeTab === 'document'
          ? 'Please upload a document with at least 10 readable characters to perform analysis.'
          : 'Please input at least 10 characters to perform analysis.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp: DetectionResponse = await detectAiContent(textToScan);
      const score = Math.round(resp.aiProbability * 100);

      const hasMetrics =
        resp.metrics != null &&
        typeof resp.metrics.perplexity === 'number' &&
        typeof resp.metrics.burstiness === 'number' &&
        typeof resp.metrics.consistency === 'number';

      const signals = (hasMetrics && resp.metrics)
        ? {
            predictability: Math.round(resp.metrics.perplexity * 100),
            variation: Math.round(resp.metrics.burstiness * 100),
            repetition: Math.round(resp.metrics.consistency * 100),
          }
        : undefined;

      const analysisData: AnalysisResultData = {
        text: textToScan,
        words: wCount,
        chars: cCount,
        aiProbability: resp.aiProbability,
        confidenceScore: typeof resp.confidenceScore === 'number' ? resp.confidenceScore : undefined,
        score,
        metrics: (hasMetrics && resp.metrics) ? resp.metrics : undefined,
        signals,
        analysis: (typeof resp.analysis === 'string' && resp.analysis.trim()) ? resp.analysis.trim() : undefined,
        patterns: Array.isArray(resp.patterns) ? resp.patterns : undefined,
        analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        documentInfo:
          activeTab === 'document' && uploadedDoc
            ? {
                name: uploadedDoc.name,
                format: uploadedDoc.format,
                sizeFormatted: uploadedDoc.sizeFormatted,
                pages: uploadedDoc.estimatedPages,
                paragraphs: uploadedDoc.paragraphCount,
              }
            : undefined,
      };

      setResult(analysisData);

      // Save locally
      localStorage.setItem('latest_analysis', JSON.stringify(analysisData));

      // Append to local history
      try {
        const histRaw = localStorage.getItem('detection_history');
        const historyList = histRaw ? JSON.parse(histRaw) : [];
        historyList.unshift({
          id: String(Date.now()),
          preview: uploadedDoc
            ? `[Document: ${uploadedDoc.name}] ${textToScan.slice(0, 60)}…`
            : textToScan.slice(0, 80) + (textToScan.length > 80 ? '…' : ''),
          text: textToScan,
          type: activeTab === 'document' ? 'Document' : 'Text',
          aiProbability: resp.aiProbability,
          score,
          confidenceScore: typeof resp.confidenceScore === 'number' ? resp.confidenceScore : undefined,
          metrics: hasMetrics ? resp.metrics : undefined,
          analysis: resp.analysis,
          patterns: resp.patterns,
          timestamp: Date.now(),
        });
        localStorage.setItem('detection_history', JSON.stringify(historyList.slice(0, 50)));
      } catch (err) {
        console.warn('Failed saving to local history:', err);
      }

      // Sync backend if logged in
      if (user?.username) {
        try {
          await saveUserDetection({
            contentPreview: uploadedDoc
              ? `[Doc: ${uploadedDoc.name}] ${textToScan.slice(0, 80)}…`
              : textToScan.slice(0, 100) + (textToScan.length > 100 ? '…' : ''),
            result: JSON.stringify(resp),
            confidence: score,
          });
        } catch (backendErr) {
          console.warn('Backend save error:', backendErr);
        }
      }
    } catch (err: any) {
      console.error('Detection request failed:', err);
      const is401 = err?.response?.status === 401 || err?.status === 401;
      const is402 = err?.response?.status === 402 || err?.status === 402;
      if (is402) {
        const details = err?.response?.data?.details;
        setQuotaModalData({
          used: details?.used ?? 20,
          limit: details?.limit ?? 20,
          resetsAt: details?.resetsAt,
        });
        setQuotaModalOpen(true);
        setError(err?.response?.data?.message || 'Monthly analysis quota reached. Please upgrade your plan to continue.');
      } else if (is401) {
        setError('Session expired or not signed in — please sign in to analyze.');
      } else {
        const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
        setError(
          apiMsg && typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Unable to reach the detection engine. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (activeTab === 'document' && uploadedDoc) {
      setUploadedDoc(null);
      setResult(null);
      setError(null);
      setFileError(null);
      return;
    }
    setDetectorText('');
    setResult(null);
    setError(null);
    setFileError(null);
  };

  const handleFileProcess = async (file: File) => {
    setFileError(null);
    setError(null);

    const validExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setFileError(`Unsupported format "${ext}". Please upload a PDF, Word (.docx), Plain Text (.txt), or Markdown (.md) document.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File exceeds the 25 MB limit. Please upload a smaller document.');
      return;
    }

    const formatName =
      ext === '.pdf'
        ? 'PDF Document (.pdf)'
        : ext === '.docx'
        ? 'Word Document (.docx)'
        : ext === '.md'
        ? 'Markdown Document (.md)'
        : 'Plain Text (.txt)';

    const sizeFormatted =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    try {
      let extracted = '';

      if (ext === '.txt' || ext === '.md') {
        extracted = await file.text();
      } else if (ext === '.docx') {
        extracted = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const decoder = new TextDecoder('utf-8', { fatal: false });
              const raw = decoder.decode(new Uint8Array(arrayBuffer));
              const textMatches: string[] = [];
              const xmlRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
              let match;
              while ((match = xmlRegex.exec(raw)) !== null) {
                if (match[1]) textMatches.push(match[1]);
              }
              if (textMatches.length > 0) {
                return resolve(textMatches.join(' ').replace(/\s+/g, ' ').trim());
              }
              const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
              resolve(printable.length > 30 ? printable : `Extracted document content from ${file.name}.`);
            } catch {
              reject(new Error('Failed reading Word document.'));
            }
          };
          reader.onerror = () => reject(new Error('Failed reading Word file.'));
          reader.readAsArrayBuffer(file);
        });
      } else if (ext === '.pdf') {
        extracted = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const decoder = new TextDecoder('latin1');
              const raw = decoder.decode(new Uint8Array(arrayBuffer));
              const textChunks: string[] = [];
              const tjRegex = /\(([^)]+)\)\s*Tj/g;
              let match;
              while ((match = tjRegex.exec(raw)) !== null) {
                if (match[1] && match[1].length > 1) {
                  textChunks.push(match[1]);
                }
              }
              if (textChunks.length > 0) {
                const combined = textChunks.join(' ').replace(/\\(\d{3})/g, '').replace(/\s+/g, ' ').trim();
                if (combined.length > 20) return resolve(combined);
              }
              const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
              let streamMatch;
              let streamText = '';
              while ((streamMatch = streamRegex.exec(raw)) !== null) {
                const s = streamMatch[1].replace(/[^\x20-\x7E\n\r\t]/g, ' ');
                if (s.trim().length > 30) streamText += ' ' + s;
              }
              if (streamText.trim().length > 30) {
                resolve(streamText.replace(/\s+/g, ' ').trim());
              } else {
                resolve(`Extracted textual payload from PDF document ${file.name} for forensic verification.`);
              }
            } catch {
              reject(new Error('Failed reading PDF document.'));
            }
          };
          reader.onerror = () => reject(new Error('Failed reading PDF file.'));
          reader.readAsArrayBuffer(file);
        });
      }

      if (!extracted || extracted.trim().length < 10) {
        setFileError('Could not extract sufficient readable text from this document. Please ensure it contains selectable text.');
        return;
      }

      const wCount = extracted.trim().split(/\s+/).filter(Boolean).length;
      const cCount = extracted.length;
      const pCount = extracted.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
      const pages = Math.max(1, Math.ceil(wCount / 350));

      setUploadedDoc({
        name: file.name,
        sizeFormatted,
        sizeBytes: file.size,
        format: formatName,
        extractedText: extracted,
        wordCount: wCount,
        charCount: cCount,
        paragraphCount: pCount,
        estimatedPages: pages,
      });

      setActiveTab('document');
      setFileError(null);
      setError(null);
    } catch (err: any) {
      setFileError(err?.message || 'Error processing document. Please verify the file is not corrupted.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');

      // Header
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
      doc.text(`Generated: ${new Date().toLocaleDateString()} · ${result.analyzedAt}`, 20, 36);
      const docDetail = result.documentInfo
        ? `Document: ${result.documentInfo.name} (${result.documentInfo.format}) | Words: ${result.words}`
        : `Word Count: ${result.words} words | Characters: ${result.chars}`;
      doc.text(docDetail, 20, 42);

      // Score Callout
      doc.setFillColor(239, 243, 231);
      doc.roundedRect(20, 50, 170, 35, 3, 3, 'F');

      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 77, 59);
      doc.text(`${result.score}%`, 28, 73);

      doc.setFontSize(12);
      doc.setTextColor(32, 36, 31);
      const verdict =
        result.score >= 60
          ? 'AI Patterns Likely (Elevated pattern match)'
          : result.score <= 35
          ? 'Mostly Human Patterns'
          : 'Mixed Linguistic Signals';
      doc.text(verdict, 60, 66);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 107);
      doc.text('Model pattern score — not definitive proof of authorship.', 60, 74);

      // Signal Breakdown (only if real metrics are present)
      let nextY = 95;
      if (
        result.signals != null &&
        typeof result.signals.predictability === 'number' &&
        typeof result.signals.variation === 'number' &&
        typeof result.signals.repetition === 'number'
      ) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(32, 36, 31);
        doc.text('Signal Breakdown', 20, 100);

        const signals = [
          ['Language Predictability', `${result.signals.predictability}%`],
          ['Sentence Variation', `${result.signals.variation}%`],
          ['Structural Repetition', `${result.signals.repetition}%`],
        ];

        let yPos = 110;
        signals.forEach(([name, val]) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 113, 107);
          doc.text(name, 20, yPos);
          doc.text(val, 160, yPos);
          yPos += 8;
        });
        nextY = yPos + 6;
      }

      // Analyzed Passage & Analysis Details Preview
      const previewY = Math.max(105, nextY);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 36, 31);
      doc.text('Linguistic Assessment Details', 20, previewY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 107);
      const interpText =
        result.analysis && result.analysis.trim()
          ? result.analysis.trim()
          : 'No analysis details were returned for this scan.';
      const splitInterp = doc.splitTextToSize(interpText, 170);
      doc.text(splitInterp, 20, previewY + 8);

      // Excerpt
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(32, 36, 31);
      doc.text('Submitted Content Excerpt', 20, previewY + 28);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 107);
      const snippet = result.text.slice(0, 350) + (result.text.length > 350 ? '…' : '');
      const splitSnippet = doc.splitTextToSize(snippet, 170);
      doc.text(splitSnippet, 20, previewY + 36);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('AI Verify • Transparent AI Pattern Detection • https://github.com/SanketP2003/AI_Detection', 20, 285);

      const scoreSuffix = typeof result.score === 'number' ? `${result.score}pct` : 'unscored';
      doc.save(`ai-verify-report-${scoreSuffix}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  const handleAskAdvisor = () => {
    if (result) {
      localStorage.setItem('latest_analysis', JSON.stringify(result));
    }
    navigate('/advisor');
  };

  const hasValidMetrics =
    result?.metrics != null &&
    typeof result.metrics.perplexity === 'number' &&
    typeof result.metrics.burstiness === 'number' &&
    typeof result.metrics.consistency === 'number';

  // ─────────────────────────────────────────────────────────────
  // RENDER: RESULTS VIEW
  // ─────────────────────────────────────────────────────────────
  if (result) {
    const isAmber = result.score >= 60;
    const isGreen = result.score <= 35;
    const tone = isAmber ? 'amber' : isGreen ? 'green' : 'neutral';

    return (
      <div className="page">
        <PageTitle
          eyebrow="ANALYSIS COMPLETE"
          title={
            isAmber
              ? 'The text shows notable AI-associated patterns.'
              : isGreen
              ? 'The text shows mostly human patterns.'
              : 'The text shows mixed linguistic signals.'
          }
          copy="This model score is one signal. It is not proof of authorship and should be interpreted with the evidence below."
          action={
            <div className="button-row">
              <Button kind="secondary" onClick={() => setResult(null)}>
                New analysis
              </Button>
              <Button kind="secondary" onClick={handleExportPDF}>
                Export PDF
              </Button>
              <Button onClick={() => navigate('/reports')}>View in reports</Button>
            </div>
          }
        />

        <div className="results-grid">
          {/* Main Score Card */}
          <section className="score-card">
            <ScoreRing value={result.score} />
            <div className="score-copy">
              <Badge tone={tone}>
                {isAmber
                  ? 'AI PATTERNS LIKELY'
                  : isGreen
                  ? 'MOSTLY HUMAN PATTERNS'
                  : 'MIXED SIGNALS'}
              </Badge>
              <h2>
                {isAmber
                  ? 'Elevated pattern match'
                  : isGreen
                  ? 'Human pattern alignment'
                  : 'Mixed pattern alignment'}
              </h2>
              <p>
                {result.analysis && result.analysis.trim()
                  ? result.analysis.trim()
                  : 'No analysis details were returned for this scan.'}
              </p>
              <div className="confidence-note">
                <strong>Important distinction</strong>
                <span>
                  {result.score}% is a model pattern score, not a {result.score}% probability that AI wrote this text.
                </span>
              </div>
            </div>
          </section>

          {/* Metadata Card */}
          <section className="meta-card">
            <span className="eyebrow">ANALYSIS DETAILS</span>
            <dl>
              <div>
                <dt>Content type</dt>
                <dd>{result.documentInfo ? result.documentInfo.format : 'Text'}</dd>
              </div>
              <div>
                <dt>Analyzed</dt>
                <dd>{result.analyzedAt || 'Just now'}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{result.words.toLocaleString()} words</dd>
              </div>
              <div>
                <dt>Characters</dt>
                <dd>{result.chars.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Reliability</dt>
                <dd>
                  {typeof result.confidenceScore === 'number'
                    ? `${Math.round(result.confidenceScore > 1 ? result.confidenceScore : result.confidenceScore * 100)}%`
                    : '—'}
                </dd>
              </div>
              {result.documentInfo && (
                <div>
                  <dt>Pages (est.)</dt>
                  <dd>{result.documentInfo.pages}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Signals Breakdown */}
        <div className="section-head">
          <div>
            <h2>Signal breakdown</h2>
            <p>Indicators that contributed to the overall score.</p>
          </div>
        </div>
        <section className="signals">
          {hasValidMetrics ? (
            [
              [
                'Language predictability',
                Math.round(result.metrics!.perplexity * 100),
                Math.round(result.metrics!.perplexity * 100) > 65
                  ? 'Higher than reference baseline'
                  : 'Within expected human range',
              ],
              [
                'Sentence variation',
                Math.round(result.metrics!.burstiness * 100),
                Math.round(result.metrics!.burstiness * 100) > 65
                  ? 'Dynamic stylistic variation'
                  : 'Moderately consistent rhythm',
              ],
              [
                'Structural repetition',
                Math.round(result.metrics!.consistency * 100),
                Math.round(result.metrics!.consistency * 100) > 65
                  ? 'Elevated syntactic templating'
                  : 'Low structural repetition',
              ],
            ].map(([label, val, note]) => (
              <div className="signal-row" key={label as string}>
                <div>
                  <strong>{label}</strong>
                  <span>{note}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${val}%` }} />
                </div>
                <b>{val}%</b>
              </div>
            ))
          ) : (
            <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>
              Signal breakdown unavailable for this analysis.
            </div>
          )}
        </section>

        {/* Analyzed Content Excerpt */}
        <div className="section-head" style={{ marginTop: '36px' }}>
          <div>
            <h2>Analyzed content</h2>
            <p>Submitted passage excerpt ({result.words.toLocaleString()} words).</p>
          </div>
        </div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '24px',
            fontSize: '14px',
            lineHeight: '1.8',
            color: 'var(--ink)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {result.text}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <Button kind="secondary" onClick={handleAskAdvisor}>
            Ask AI Advisor
          </Button>
          <Button kind="ghost" onClick={() => navigate('/history')}>
            View in history →
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: NEW ANALYSIS INPUT VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="page narrow">
      <PageTitle
        eyebrow="NEW ANALYSIS"
        title="What would you like to examine?"
        copy="Add content or upload documents below to identify patterns commonly associated with AI-generated text."
      />

      <UsageStrip />

      <div className="mode-tabs">
        <button
          type="button"
          className={activeTab === 'text' ? 'selected' : ''}
          onClick={() => {
            setActiveTab('text');
            setFileError(null);
          }}
        >
          ¶ Text
        </button>
        <button
          type="button"
          className={activeTab === 'document' ? 'selected' : ''}
          onClick={() => {
            setActiveTab('document');
            setFileError(null);
          }}
        >
          ▧ Document
        </button>
      </div>

      {activeTab === 'text' ? (
        <section className="editor-shell">
          <div className="editor-toolbar">
            <span>Plain text input</span>
            <div className="button-row" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setDetectorText(SAMPLE_TEXT_HUMAN);
                  setError(null);
                }}
              >
                Human sample
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetectorText(SAMPLE_TEXT_AI);
                  setError(null);
                }}
              >
                AI sample
              </button>
              {detectorText && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ color: 'var(--muted)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={detectorText}
            onChange={(e) => {
              setDetectorText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste or write the content you want to analyze…"
            autoFocus
          />

          <div className="editor-footer">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} characters</span>
            <span className={wordCount < 25 && wordCount > 0 ? 'warning-text' : ''}>
              {wordCount === 0
                ? 'Enter text to begin'
                : wordCount < 25
                ? 'Minimum 25 words recommended'
                : 'Ready to analyze'}
            </span>
          </div>
        </section>
      ) : (
        <section className="editor-shell">
          <div className="editor-toolbar">
            <span>Supported: PDF, DOCX, TXT, MD</span>
            <div className="button-row" style={{ gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setUploadedDoc(SAMPLE_DOCUMENTS[0]);
                  setFileError(null);
                  setError(null);
                }}
              >
                Sample PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadedDoc(SAMPLE_DOCUMENTS[1]);
                  setFileError(null);
                  setError(null);
                }}
              >
                Sample DOCX
              </button>
              {uploadedDoc && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ color: 'var(--muted)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {!uploadedDoc ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '60px 30px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? 'var(--sage)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <div style={{ fontSize: '32px', color: 'var(--green)', marginBottom: '12px' }}>▧</div>
              <h3 style={{ font: '600 16px Manrope', margin: '0 0 6px', color: 'var(--ink)' }}>
                Drop your document here, or browse files
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Supports PDF (.pdf), Microsoft Word (.docx), Plain Text (.txt), and Markdown (.md)
              </p>
            </div>
          ) : (
            <div style={{ padding: '24px 28px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <strong style={{ font: '600 15px Manrope', color: 'var(--ink)', display: 'block' }}>
                    {uploadedDoc.name}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {uploadedDoc.format} · {uploadedDoc.sizeFormatted} · {uploadedDoc.wordCount} words · ~{uploadedDoc.estimatedPages} page{uploadedDoc.estimatedPages > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Change document
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
              </div>
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  color: 'var(--ink)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {uploadedDoc.extractedText}
              </div>
            </div>
          )}

          <div className="editor-footer">
            <span>{uploadedDoc ? `${uploadedDoc.wordCount} words extracted` : 'No file selected'}</span>
            <span>{uploadedDoc ? uploadedDoc.sizeFormatted : 'Up to 25MB'}</span>
            <span className={uploadedDoc ? '' : 'warning-text'}>
              {uploadedDoc ? 'Ready to analyze' : 'Awaiting document'}
            </span>
          </div>
        </section>
      )}

      {fileError && (
        <div style={{ color: 'var(--amber)', fontSize: '12px', marginTop: '12px' }}>
          {fileError}
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--amber-bg)',
            color: 'var(--amber)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span>{error}</span>
          {error.includes('quota') && (
            <Button
              kind="secondary"
              onClick={() => navigate('/pricing')}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              View plans
            </Button>
          )}
        </div>
      )}

      <div className="analysis-footer">
        <div className="privacy">
          <span>⌁</span>
          <div>
            <strong>Private by design</strong>
            <p>Your content is processed securely and is not used to train public models.</p>
          </div>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || (activeTab === 'text' ? wordCount < 5 : !uploadedDoc)}
        >
          {loading ? (ANALYSIS_STEPS[analysisStep] || 'Analyzing patterns…') : 'Analyze content →'}
        </Button>
      </div>

      {/* Hard Limit Modal (D3) */}
      <Modal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        title="Monthly limit reached"
        eyebrow="QUOTA REACHED"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)' }}>
            You have used all {quotaModalData.limit} analyses in your current monthly billing period.
            {quotaModalData.resetsAt && (
              <span> Your quota will reset on {new Date(quotaModalData.resetsAt).toLocaleDateString()}.</span>
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button kind="secondary" onClick={() => setQuotaModalOpen(false)}>
              Not now
            </Button>
            <Button kind="primary" onClick={() => navigate('/pricing')}>
              View plans
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
