import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDetections, deleteUserDetection } from '../api/client';
import { PageTitle, Button, Badge } from '../components/CommonUI';

interface HistoryRecord {
  id: string;
  backendId?: number;
  title: string;
  text: string;
  type: string;
  scoreText: string;
  scoreValue?: number;
  confidenceScore?: number;
  verdict: string;
  dateText: string;
  timestamp: number;
  wordCount: number;
  metrics?: {
    perplexity?: number;
    burstiness?: number;
    consistency?: number;
  };
  analysis?: string;
  patterns?: string[];
  fullData?: any;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [sortOrder, setSortOrder] = useState('Newest first');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchHistory = async () => {
    setLoading(true);
    const list: HistoryRecord[] = [];

    // 1. Read local storage
    try {
      const local = localStorage.getItem('detection_history');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any, idx: number) => {
            const prob = typeof item.aiProbability === 'number'
              ? Math.round(item.aiProbability * 100)
              : typeof item.score === 'number'
              ? Math.round(item.score)
              : undefined;
            const hasScore = typeof prob === 'number';
            const conf = typeof item.confidenceScore === 'number' ? item.confidenceScore : undefined;
            const textContent = item.text || item.contentPreview || '';
            const words = textContent.trim() ? textContent.trim().split(/\s+/).filter(Boolean).length : 0;
            const ts = item.timestamp
              ? typeof item.timestamp === 'number'
                ? item.timestamp
                : new Date(item.timestamp).getTime()
              : Date.now() - idx * 1000;

            const detectedType = item.type || (item.preview && item.preview.startsWith('[Doc') ? 'Document' : 'Text');

            list.push({
              id: item.id || `loc-${idx}`,
              title: item.preview || item.contentPreview || (item.text ? item.text.slice(0, 60) + '…' : 'Text scan'),
              text: textContent,
              type: detectedType,
              scoreText: hasScore ? `${prob}%` : '—',
              scoreValue: prob,
              confidenceScore: conf,
              verdict: hasScore
                ? prob >= 60
                  ? 'AI patterns likely'
                  : prob <= 35
                  ? 'Mostly human patterns'
                  : 'Mixed signals'
                : 'Not scored',
              dateText: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent',
              timestamp: ts,
              wordCount: words,
              metrics: item.metrics,
              analysis: item.analysis,
              patterns: Array.isArray(item.patterns) ? item.patterns : [],
              fullData: item,
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
            const prob = typeof parsedResult.aiProbability === 'number'
              ? Math.round(parsedResult.aiProbability * 100)
              : typeof b.confidence === 'number'
              ? Math.round(b.confidence)
              : undefined;
            const hasScore = typeof prob === 'number';
            const conf = typeof parsedResult.confidenceScore === 'number' ? parsedResult.confidenceScore : undefined;
            const textContent = parsedResult.text || b.contentPreview || '';
            const words = textContent.trim() ? textContent.trim().split(/\s+/).filter(Boolean).length : 0;
            const ts = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();
            const detectedType = (b.contentPreview && b.contentPreview.startsWith('[Doc')) ? 'Document' : 'Text';

            if (!list.some((existing) => existing.backendId === b.id || existing.id === String(b.id) || existing.id === `srv-${b.id}`)) {
              list.unshift({
                id: `srv-${b.id}`,
                backendId: b.id,
                title: b.contentPreview || 'Scan snippet',
                text: textContent,
                type: detectedType,
                scoreText: hasScore ? `${prob}%` : '—',
                scoreValue: prob,
                confidenceScore: conf,
                verdict: hasScore
                  ? prob >= 60
                    ? 'AI patterns likely'
                    : prob <= 35
                    ? 'Mostly human patterns'
                    : 'Mixed signals'
                  : 'Not scored',
                dateText: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent',
                timestamp: ts,
                wordCount: words,
                metrics: parsedResult.metrics,
                analysis: parsedResult.analysis,
                patterns: Array.isArray(parsedResult.patterns) ? parsedResult.patterns : [],
                fullData: {
                  ...parsedResult,
                  contentPreview: b.contentPreview,
                  aiProbability: hasScore ? prob / 100 : undefined,
                  confidenceScore: conf,
                },
              });
            }
          });
        }
      } catch (err) {
        console.warn('Backend history error:', err);
      }
    }

    setRecords(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let res = records.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.text.toLowerCase().includes(search.toLowerCase()) ||
        r.verdict.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'All types' || r.type === typeFilter;
      return matchSearch && matchType;
    });

    if (sortOrder === 'Newest first') {
      res.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'Oldest first') {
      res.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'Highest score') {
      res.sort((a, b) => {
        if (typeof a.scoreValue !== 'number') return 1;
        if (typeof b.scoreValue !== 'number') return -1;
        return b.scoreValue - a.scoreValue;
      });
    } else if (sortOrder === 'Lowest score') {
      res.sort((a, b) => {
        if (typeof a.scoreValue !== 'number') return 1;
        if (typeof b.scoreValue !== 'number') return -1;
        return a.scoreValue - b.scoreValue;
      });
    }

    return res;
  }, [records, search, typeFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const handleViewScan = (scan: HistoryRecord) => {
    const hasValidMetrics =
      scan.metrics != null &&
      typeof scan.metrics.perplexity === 'number' &&
      typeof scan.metrics.burstiness === 'number' &&
      typeof scan.metrics.consistency === 'number';

    const fullData = {
      text: scan.text || scan.title,
      words: scan.wordCount,
      chars: (scan.text || scan.title).length,
      aiProbability: typeof scan.scoreValue === 'number' ? scan.scoreValue / 100 : 0,
      confidenceScore: scan.confidenceScore,
      score: typeof scan.scoreValue === 'number' ? scan.scoreValue : 0,
      metrics: scan.metrics,
      signals: hasValidMetrics
        ? {
            predictability: Math.round(scan.metrics!.perplexity! * 100),
            variation: Math.round(scan.metrics!.burstiness! * 100),
            repetition: Math.round(scan.metrics!.consistency! * 100),
          }
        : undefined,
      analysis: scan.analysis,
      analyzedAt: scan.dateText,
    };
    localStorage.setItem('latest_analysis', JSON.stringify(fullData));
    navigate('/detection?view=results');
  };

  const handleDelete = async (e: React.MouseEvent, scan: HistoryRecord) => {
    e.stopPropagation();
    if (!window.confirm(`Delete analysis "${scan.title}"?`)) return;

    if (scan.backendId) {
      try {
        await deleteUserDetection(scan.backendId);
      } catch (err) {
        console.warn('Failed deleting from server:', err);
      }
    }

    const updated = records.filter((r) => r.id !== scan.id);
    setRecords(updated);

    try {
      const local = localStorage.getItem('detection_history');
      if (local) {
        const parsed = JSON.parse(local);
        const filteredLocal = parsed.filter((p: any) => p.id !== scan.id && String(p.id) !== scan.id);
        localStorage.setItem('detection_history', JSON.stringify(filteredLocal));
      }
    } catch {}
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Type',
      'Score (%)',
      'Verdict',
      'Reliability (%)',
      'Predictability (%)',
      'Variation (%)',
      'Repetition (%)',
      'Preview',
    ];

    const rows = filtered.map((r) => [
      r.backendId ? String(r.backendId) : r.id,
      new Date(r.timestamp).toISOString(),
      r.type,
      typeof r.scoreValue === 'number' ? `${r.scoreValue}%` : '—',
      r.verdict || '—',
      typeof r.confidenceScore === 'number'
        ? `${Math.round(r.confidenceScore > 1 ? r.confidenceScore : r.confidenceScore * 100)}%`
        : '—',
      typeof r.metrics?.perplexity === 'number'
        ? `${Math.round(r.metrics.perplexity * 100)}%`
        : '—',
      typeof r.metrics?.burstiness === 'number'
        ? `${Math.round(r.metrics.burstiness * 100)}%`
        : '—',
      typeof r.metrics?.consistency === 'number'
        ? `${Math.round(r.metrics.consistency * 100)}%`
        : '—',
      `"${(r.title || r.text || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-verify-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <PageTitle
        title="Scan history"
        copy="Search, review, and manage your previous analyses."
        action={
          <Button onClick={() => navigate('/detection')}>
            ＋ New analysis
          </Button>
        }
      />

      <div className="filters">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search analyses…"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option>All types</option>
          <option>Text</option>
          <option>Document</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option>Newest first</option>
          <option>Oldest first</option>
          <option>Highest score</option>
          <option>Lowest score</option>
        </select>
        {filtered.length > 0 && (
          <Button kind="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        )}
        <button
          className="icon-button"
          onClick={fetchHistory}
          title="Refresh history"
          disabled={loading}
          style={{ width: '38px', height: '38px' }}
        >
          ↻
        </button>
      </div>

      <div className="table-shell">
        <div className="table-head">
          <span>Analysis</span>
          <span>Type</span>
          <span>Result</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {paginated.length > 0 ? (
          paginated.map((row) => {
            const isScored = typeof row.scoreValue === 'number';
            const tone = !isScored
              ? 'neutral'
              : row.scoreValue! >= 60
              ? 'amber'
              : row.scoreValue! <= 35
              ? 'green'
              : 'neutral';

            return (
              <div
                className="table-row"
                key={row.id}
                onClick={() => handleViewScan(row)}
                style={{ cursor: 'pointer' }}
              >
                <span>
                  <b>{row.title}</b>
                  <small>
                    {row.backendId ? `ID #${row.backendId}` : row.id} · {row.wordCount} words
                  </small>
                </span>
                <span>
                  <Badge tone={row.type === 'Document' ? 'sage' : 'neutral'}>
                    {row.type}
                  </Badge>
                </span>
                <span>
                  <b>{row.scoreText}</b>
                  <small>
                    <Badge tone={tone} style={{ padding: '2px 6px', fontSize: '8px' }}>
                      {row.verdict}
                    </Badge>
                  </small>
                </span>
                <span>
                  <small>{row.dateText}</small>
                </span>
                <span style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, row)}
                    title="Delete entry"
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                    }}
                  >
                    ✕
                  </button>
                </span>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <span>⌕</span>
            <h3>No analyses found</h3>
            <p>Try a different search term or clear your filters.</p>
          </div>
        )}
      </div>

      {filtered.length > pageSize && (
        <div className="pagination">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </button>
            <button className="current">{currentPage}</button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
