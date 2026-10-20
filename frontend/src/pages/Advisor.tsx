import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithAdvisor } from '../api/client';
import { Badge } from '../components/CommonUI';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Advisor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [analysisContext, setAnalysisContext] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('latest_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          const prob = typeof parsed.aiProbability === 'number'
            ? Math.round(parsed.aiProbability * 100)
            : typeof parsed.score === 'number'
            ? parsed.score
            : null;
          if (prob !== null) {
            setLatestScore(prob);
            setAnalysisContext(
              `Context of latest scan: Model Score ${prob}%, Excerpt: "${(parsed.text || parsed.contentPreview || '').slice(0, 150)}..."`
            );
          }
        }
      }
    } catch (e) {
      console.warn('Error reading latest analysis for advisor:', e);
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, errorMsg]);

  const send = async (textToSend?: string) => {
    const content = (textToSend || draft).trim();
    if (!content || loading) return;

    setErrorMsg(null);
    setLastFailedPrompt(null);
    const userMsg: Message = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setDraft('');
    setLoading(true);

    try {
      // Build conversation history for API
      const historyPayload = [
        {
          role: 'system',
          content: `You are AI Verify's expert forensic writing advisor. You help users understand AI detection scores, linguistic metrics (perplexity, burstiness, consistency), false positives, and ethical interpretations. ${analysisContext}`,
        },
        ...updated.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        })),
      ];

      const reply = await chatWithAdvisor(content, historyPayload);
      setMessages([...updated, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      console.error('Advisor error:', err);
      setErrorMsg('Advisor is temporarily unavailable.');
      setLastFailedPrompt(content);
    } finally {
      setLoading(false);
    }
  };

  let initials = 'AV';
  if (user?.username) {
    const parts = user.username.trim().split(/\s+/);
    initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : user.username.slice(0, 2).toUpperCase();
  }

  return (
    <div className="advisor-page">
      <div className="advisor-head">
        <div>
          <span className="eyebrow">CONTEXTUAL GUIDANCE</span>
          <h1>AI Advisor</h1>
          <p>Explore findings, limitations, and next steps with analysis-aware guidance.</p>
        </div>
        {latestScore !== null ? (
          <Badge tone="sage">Linked to latest scan ({latestScore}%)</Badge>
        ) : (
          <Badge tone="neutral">General advisory mode</Badge>
        )}
      </div>

      <div className="chat">
        {/* Initial Assistant Context Bubble */}
        <div className="assistant-message">
          <div className="ai-avatar">A</div>
          <div>
            <strong>AI Advisor</strong>
            <p>
              {latestScore !== null
                ? `I can help you interpret the ${latestScore}% pattern score from your latest analysis. Remember: this score describes model-observed language patterns, not who authored the content.`
                : 'I can help you understand AI detection scores, linguistic metrics (perplexity, burstiness, consistency), false positive risks, and ethical considerations. You can run an analysis first or ask general questions below.'}
            </p>
            <div className="prompts">
              <button onClick={() => send('Which signals influenced this score most?')}>
                Which signals influenced this score most?
              </button>
              <button onClick={() => send('How should I communicate this finding?')}>
                How should I communicate this finding?
              </button>
              <button onClick={() => send('What are common causes of false positives?')}>
                What are common causes of false positives?
              </button>
            </div>
          </div>
        </div>

        {/* Conversation Stream */}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'user-message' : 'assistant-message'}>
            {m.role === 'assistant' && <div className="ai-avatar">A</div>}
            <div>
              <strong>{m.role === 'user' ? 'You' : 'AI Advisor'}</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
            {m.role === 'user' && <div className="avatar">{initials}</div>}
          </div>
        ))}

        {loading && (
          <div className="assistant-message">
            <div className="ai-avatar">A</div>
            <div>
              <strong>AI Advisor</strong>
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                Formulating response…
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="assistant-message" style={{ borderLeft: '3px solid var(--amber)' }}>
            <div className="ai-avatar" style={{ background: 'var(--amber)' }}>!</div>
            <div>
              <strong>Advisor Notice</strong>
              <p style={{ color: 'var(--amber)', margin: '4px 0 8px' }}>{errorMsg}</p>
              {lastFailedPrompt && (
                <button
                  onClick={() => {
                    const prompt = lastFailedPrompt;
                    setErrorMsg(null);
                    send(prompt);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--amber)',
                    color: 'var(--amber)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this analysis or interpretation guidelines…"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          aria-label="Message to AI Advisor"
        />
        <button onClick={() => send()} disabled={!draft.trim() || loading} aria-label="Send message">
          {loading ? '…' : '↑'}
        </button>
        <span>AI responses provide guidance on pattern indicators. Verify important conclusions independently.</span>
      </div>
    </div>
  );
}
