import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Button, Badge } from '../components/CommonUI';
import MagneticButton from '../components/MagneticButton';
import ScrollReveal from '../animations/ScrollReveal';
import { useHeroTimeline } from '../animations/HeroTimeline';

interface SampleCase {
  id: string;
  tabLabel: string;
  badgeText: string;
  badgeTone: 'amber' | 'green' | 'neutral' | 'sage';
  score: number;
  scoreStatus: string;
  scoreDescription: string;
  perplexityValue: string;
  perplexityPct: number;
  burstinessValue: string;
  burstinessPct: number;
  repetitionValue: string;
  repetitionPct: number;
  sentences: { text: string; type: 'ai' | 'mixed' | 'human'; prob: string }[];
}

const HERO_SAMPLES: SampleCase[] = [
  {
    id: 'chatgpt',
    tabLabel: 'AI Generated',
    badgeText: 'AI PATTERNS DETECTED',
    badgeTone: 'amber',
    score: 94,
    scoreStatus: 'Elevated Model Pattern',
    scoreDescription: 'Low perplexity & uniform sentence lengths indicate synthetic generation.',
    perplexityValue: '14.2 (Low variance)',
    perplexityPct: 92,
    burstinessValue: '0.18 (Uniform cadence)',
    burstinessPct: 88,
    repetitionValue: '91% (High token predictability)',
    repetitionPct: 91,
    sentences: [
      { text: 'Artificial intelligence represents an unprecedented paradigm shift across modern technological ecosystems.', type: 'ai', prob: '96% synthetic' },
      { text: 'It is imperative to recognize that machine learning models fundamentally transform how organizations streamline digital workflows.', type: 'ai', prob: '94% synthetic' },
      { text: 'Furthermore, these advancements foster enhanced collaboration and drive synergistic efficiencies across multi-disciplinary teams.', type: 'ai', prob: '92% synthetic' },
      { text: 'In conclusion, the future of automated discovery will inevitably redefine human creative potential.', type: 'ai', prob: '95% synthetic' },
    ],
  },
  {
    id: 'human',
    tabLabel: 'Human Written',
    badgeText: 'HUMAN PATTERNS DOMINANT',
    badgeTone: 'green',
    score: 12,
    scoreStatus: 'Natural Linguistic Flow',
    scoreDescription: 'High burstiness, dynamic syntax variance, and idiosyncratic vocabulary.',
    perplexityValue: '86.4 (High entropy)',
    perplexityPct: 15,
    burstinessValue: '0.84 (Dynamic cadence)',
    burstinessPct: 12,
    repetitionValue: '18% (Natural distribution)',
    repetitionPct: 18,
    sentences: [
      { text: 'We sat on the damp wooden steps waiting for the fog to lift off the river.', type: 'human', prob: '9% synthetic' },
      { text: 'Neither of us spoke—not because we were angry, but because the cold seemed to swallow any words before they could take shape.', type: 'human', prob: '11% synthetic' },
      { text: 'A lone heron cut across the grey water, deliberate and slow, reminding me of winters spent in Maine.', type: 'human', prob: '8% synthetic' },
      { text: 'You looked at your watch, shook your head, and finally smiled.', type: 'human', prob: '14% synthetic' },
    ],
  },
  {
    id: 'hybrid',
    tabLabel: 'AI-Human Hybrid',
    badgeText: 'MIXED SYNTHESIS SIGNALS',
    badgeTone: 'amber',
    score: 61,
    scoreStatus: 'Dual-Pattern Synthesis',
    scoreDescription: 'Algorithmic transitions blended with organic anecdotal observations.',
    perplexityValue: '48.1 (Mixed distribution)',
    perplexityPct: 62,
    burstinessValue: '0.46 (Moderate variation)',
    burstinessPct: 54,
    repetitionValue: '58% (Assisted structure)',
    repetitionPct: 60,
    sentences: [
      { text: 'When investigating linguistic anomalies, researchers often encounter hybrid compositions that blend distinct stylistic cadences.', type: 'ai', prob: '88% synthetic' },
      { text: 'I remember testing our first classifier back in 2023 on my own rough thesis notes.', type: 'human', prob: '12% synthetic' },
      { text: 'While the algorithmic structure suggests high probabilistic coherence, the specific anecdotal phrasing reflects genuine personal memory.', type: 'mixed', prob: '65% synthetic' },
      { text: 'Consequently, human oversight remains indispensable when evaluating nuanced narrative documents.', type: 'ai', prob: '84% synthetic' },
    ],
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [hoveredSentence, setHoveredSentence] = useState<number | null>(null);

  // GSAP hero intro timeline orchestration
  const { heroRef, demoRef } = useHeroTimeline();

  const currentSample = HERO_SAMPLES[activeSampleIndex];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    [
      'What is AI Verify?',
      'AI Verify is a workspace for analyzing text patterns commonly associated with AI-generated language and interpreting those findings with appropriate context.',
    ],
    [
      'What content can it analyze?',
      'The current workspace supports pasted text analysis and document detection (.pdf, .docx, .txt, .md) with deep forensic metrics.',
    ],
    [
      'How should I interpret a detection score?',
      'Treat it as a model pattern score, not proof or a calibrated probability of authorship. Review the contributing indicators and the context around the content.',
    ],
    [
      'Can human-written content be flagged?',
      'Yes. Detection systems can produce false positives, and AI-generated content can also go undetected. A score should never be used as the sole basis for a consequential decision.',
    ],
    [
      'Does the application store submitted content?',
      'The workspace includes a user-controlled analysis-history setting. You can disable history saving or delete all records at any time from Settings.',
    ],
    [
      'How does the AI Advisor work?',
      'The Advisor is connected to your latest analysis so you can ask contextual questions about its score, indicators, and methodology limitations in real time.',
    ],
  ];

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTestInWorkspace = () => {
    const fullText = currentSample.sentences.map((s) => s.text).join(' ');
    try {
      localStorage.setItem('pending_demo_text', fullText);
    } catch { }
    navigate('/detection');
  };



  return (
    <div className={`landing ${resolvedTheme} landing-ambient-wrapper`}>
      {/* Atmospheric Ambient Orbs */}
      <div className="ambient-orb ambient-orb-1" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-2" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-3" aria-hidden="true" />

      {/* Sticky Glass Navigation */}
      <div className={`landing-header-sticky ${isScrolled ? 'scrolled' : ''}`}>
        <header className="landing-nav">
          <button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src="/logo.png"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.svg'; }}
              alt="AI Verify"
              style={{ width: 30, height: 30, objectFit: 'contain' }}
            />
            <span>AI Verify</span>
          </button>

          <nav className={menuOpen ? 'open' : ''}>
            <a href="#product" onClick={(e) => { e.preventDefault(); scrollTo('#product'); }}>Product</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('#features'); }}>Features</a>
            <a href="#method" onClick={(e) => { e.preventDefault(); scrollTo('#method'); }}>How it works</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }}>About</a>
            <Link to="/signin" onClick={() => setMenuOpen(false)}>Sign in</Link>
          </nav>

          <div className="landing-actions">
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {resolvedTheme === 'light' ? '◐' : '○'}
            </button>
            <button
              className="landing-menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <Button onClick={() => navigate('/detection')}>Try AI Verify</Button>
          </div>
        </header>
      </div>

      <main>
        {/* Minimalist Editorial Hero Section */}
        <section className="landing-hero" id="product" ref={heroRef}>
          <div className="hero-copy">
            {/* Elegant Minimalist Pill */}
            <div className="hero-pill-badge">
              <span className="hero-pill-dot" aria-hidden="true" />
              <span>AI Analysis · With Context</span>
            </div>

            {/* Editorial Headline */}
            <h1>
              Detect AI text with{' '}
              <span className="hero-text-accent">clarity and context</span>.
            </h1>

            <p>
              Inspect sentence perplexity, burstiness variation, and token rhythm in real time.
              Designed for researchers, editors, and educators who need explainable evidence — not opaque certainty.
            </p>

            {/* Restrained Action CTAs */}
            <div className="hero-cta-group">
              <Button onClick={() => navigate('/detection')}>
                Start free analysis →
              </Button>
              <Button kind="secondary" onClick={() => scrollTo('#features')}>
                Explore how it works
              </Button>
            </div>

            {/* Typographic Trust Bar */}
            <div className="hero-trust-bar">
              <span>Empirical signal evaluation</span>
              <span className="dot-divider">•</span>
              <span>Transparent methodology</span>
              <span className="dot-divider">•</span>
              <span>Controlled data retention</span>
            </div>
          </div>

          {/* Minimalist Editorial Linguistic Inspector Canvas */}
          <div className="hero-canvas-container" ref={demoRef}>
            <div className="minimal-manuscript-card">
              {/* Header: Clean Segmented Sample Switcher & Status */}
              <div className="manuscript-header">
                <div className="manuscript-tabs" role="tablist" aria-label="Sample text cases">
                  {HERO_SAMPLES.map((sample, idx) => (
                    <button
                      key={sample.id}
                      type="button"
                      role="tab"
                      aria-selected={activeSampleIndex === idx}
                      className={`manuscript-tab ${activeSampleIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSampleIndex(idx);
                        setHoveredSentence(null);
                      }}
                    >
                      {sample.tabLabel}
                    </button>
                  ))}
                </div>

                <div className="manuscript-status">
                  <Badge tone={currentSample.badgeTone}>{currentSample.badgeText}</Badge>
                  <span className="manuscript-score">
                    <strong>{currentSample.score}%</strong> pattern match
                  </span>
                </div>
              </div>

              {/* Prose Inspection Area */}
              <div className="manuscript-body">
                <div className="manuscript-prose">
                  {currentSample.sentences.map((sent, i) => (
                    <span
                      key={i}
                      className={`prose-sentence highlight-${sent.type} ${hoveredSentence === i ? 'is-active' : ''}`}
                      onMouseEnter={() => setHoveredSentence(i)}
                      onMouseLeave={() => setHoveredSentence(null)}
                      onClick={() => setHoveredSentence(hoveredSentence === i ? null : i)}
                      title={`${sent.prob} · Perplexity: ${currentSample.perplexityValue}`}
                    >
                      {sent.text}{' '}
                    </span>
                  ))}
                </div>

                {/* Micro-Inspector Line */}
                <div className="manuscript-inspector-bar">
                  <div className="prose-legend">
                    <span className="legend-tag">
                      <span className="tag-dot human" /> Human Syntax
                    </span>
                    <span className="legend-tag">
                      <span className="tag-dot mixed" /> Mixed Variation
                    </span>
                    <span className="legend-tag">
                      <span className="tag-dot ai" /> Algorithmic Cadence
                    </span>
                  </div>

                  <div className="sentence-probe">
                    {hoveredSentence !== null ? (
                      <span className="probe-active">
                        <strong>Sentence #{hoveredSentence + 1}:</strong> {currentSample.sentences[hoveredSentence].prob}
                      </span>
                    ) : (
                      <span className="probe-hint">Hover or click any sentence to view linguistic confidence</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Forensic Metrics Strip */}
              <div className="manuscript-footer">
                <div className="manuscript-metrics">
                  <div className="metric-cell">
                    <div className="metric-header">
                      <span className="metric-name">Token Perplexity</span>
                      <span className="metric-stat">{currentSample.perplexityValue}</span>
                    </div>
                    <div className="metric-line-track">
                      <div
                        className="metric-line-fill"
                        style={{
                          width: `${currentSample.perplexityPct}%`,
                          backgroundColor: currentSample.score >= 60 ? 'var(--amber)' : 'var(--green)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="metric-cell">
                    <div className="metric-header">
                      <span className="metric-name">Burstiness Entropy</span>
                      <span className="metric-stat">{currentSample.burstinessValue}</span>
                    </div>
                    <div className="metric-line-track">
                      <div
                        className="metric-line-fill"
                        style={{
                          width: `${currentSample.burstinessPct}%`,
                          backgroundColor: currentSample.score >= 60 ? 'var(--amber)' : 'var(--green)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="metric-cell">
                    <div className="metric-header">
                      <span className="metric-name">Syntactic Cadence</span>
                      <span className="metric-stat">{currentSample.repetitionValue}</span>
                    </div>
                    <div className="metric-line-track">
                      <div
                        className="metric-line-fill"
                        style={{
                          width: `${currentSample.repetitionPct}%`,
                          backgroundColor: currentSample.score >= 60 ? 'var(--amber)' : 'var(--green)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="manuscript-action">
                  <span className="manuscript-summary">
                    {currentSample.scoreDescription}
                  </span>
                  <button
                    type="button"
                    className="manuscript-open-btn"
                    onClick={handleTestInWorkspace}
                  >
                    <span>Analyze in editor</span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="hero-disclaimer">
              Illustrative analysis. Results describe statistical language features and do not constitute proof of authorship.
            </p>
          </div>
        </section>

        {/* Principle Strip — Staggered Reveal */}
        <ScrollReveal stagger y={30}>
          <section className="principle-strip">
            <div>
              <span>◎</span>
              <p>
                <b>Transparent results</b>
                Scores explained without overstating certainty.
              </p>
            </div>
            <div>
              <span>≋</span>
              <p>
                <b>Understandable analysis</b>
                Indicators presented in clear, practical language.
              </p>
            </div>
            <div>
              <span>◇</span>
              <p>
                <b>Privacy-conscious design</b>
                User-controlled history and careful processing.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* Why Context Matters */}
        <ScrollReveal y={35}>
          <section className="story-section">
            <div>
              <span className="eyebrow">WHY CONTEXT MATTERS</span>
              <h2>A score alone isn’t the whole story.</h2>
              <p>
                A binary label cannot explain uncertainty, reveal what influenced a result, or account for false positives and false negatives. Responsible review needs the signal and the surrounding context.
              </p>
            </div>
            <div className="story-visual verdant-glass-panel">
              <div className="story-score">
                <strong>68</strong>
                <span>Illustrative model score</span>
              </div>
              <div className="story-copy">
                <Badge tone="amber">REVIEW RECOMMENDED</Badge>
                <h3>Some indicators are elevated</h3>
                <p>Language predictability contributed most strongly. Sentence variation and repetition were mixed.</p>
                <span>Not a probability of AI authorship</span>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Showcase / Features */}
        <section className="showcase" id="features">
          <ScrollReveal y={30}>
            <div className="showcase-heading">
              <span className="eyebrow">ONE COHERENT WORKFLOW</span>
              <h2>From first draft to deeper understanding.</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal y={40}>
            <article className="feature-row">
              <div className="feature-copy">
                <span>01 · TEXT ANALYSIS</span>
                <h3>A focused place to examine language.</h3>
                <p>Analyze supported text and explore the signals behind the assessment with complete clarity.</p>
                <button onClick={() => navigate('/detection')}>Open the editor →</button>
              </div>
              <div className="editor-mock">
                <div>
                  <span>Plain text</span>
                  <small>Use example</small>
                </div>
                <p>Artificial intelligence is changing how people create, research, and communicate. Detection tools can identify patterns...</p>
                <footer>
                  <span>27 words</span>
                  <b>Analyze content →</b>
                </footer>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal y={40}>
            <article className="feature-row reverse">
              <div className="feature-copy">
                <span>02 · SUPPORTED INPUTS</span>
                <h3>Direct text and document forensics.</h3>
                <p>Analyze text or upload documents (.pdf, .docx, .txt, .md). Inspect extracted structure, word counts, and stylistic signatures.</p>
                <Badge tone="green">DOCUMENT DETECTION ACTIVE</Badge>
              </div>
              <div className="upload-mock">
                <div>
                  <span>▧</span>
                  <h4>Document Detection Engine</h4>
                  <p>Upload PDF, DOCX, Markdown, and text files. Extract and analyze multi-page documents in seconds.</p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal y={40}>
            <article className="feature-row">
              <div className="feature-copy">
                <span>03 · EXPLAINABLE RESULTS</span>
                <h3>Go beyond the label.</h3>
                <p>Understand the result, its supporting information, and its limitations with visual breakdowns.</p>
                <button onClick={() => navigate('/detection')}>Explore sample results →</button>
              </div>
              <div className="result-mock">
                <header>
                  <Badge tone="amber">AI PATTERNS LIKELY</Badge>
                  <strong>68<span>/100</span></strong>
                </header>
                {[
                  ['Predictability', 82],
                  ['Variation', 61],
                  ['Repetition', 48],
                ].map(([n, v]) => (
                  <div key={n as string}>
                    <span>{n}</span>
                    <i>
                      <em style={{ width: `${v}%` }} />
                    </i>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal y={40}>
            <article className="feature-row reverse">
              <div className="feature-copy">
                <span>04 · AI ADVISOR</span>
                <h3>Ask better questions about a result.</h3>
                <p>Explore your latest analysis through contextual questions and guided explanations tailored to your findings.</p>
                <button onClick={() => navigate('/advisor')}>Meet the Advisor →</button>
              </div>
              <div className="advisor-mock">
                <div>
                  <b>AI Advisor</b>
                  <p>I can help explain which signals influenced this illustrative score and where uncertainty remains.</p>
                </div>
                <div className="advisor-question">Which indicator mattered most?</div>
                <small>Linked to latest analysis in this workspace</small>
              </div>
            </article>
          </ScrollReveal>
        </section>

        {/* Process Section */}
        <ScrollReveal y={35}>
          <section className="process-section" id="method">
            <div>
              <span className="eyebrow">HOW IT WORKS</span>
              <h2>Three steps. No black-box theater.</h2>
            </div>
            <div className="process-steps">
              <article>
                <b>01</b>
                <span>
                  <h3>Submit</h3>
                  <p>Enter supported text in the analysis workspace.</p>
                </span>
              </article>
              <article>
                <b>02</b>
                <span>
                  <h3>Analyze</h3>
                  <p>Let the application process the submitted content across multi-layered linguistic models.</p>
                </span>
              </article>
              <article>
                <b>03</b>
                <span>
                  <h3>Understand</h3>
                  <p>Review available findings, signal breakdowns, and interpret them in appropriate context.</p>
                </span>
              </article>
            </div>
          </section>
        </ScrollReveal>

        {/* Product Preview Section */}
        <ScrollReveal y={40}>
          <section className="product-preview-section">
            <div className="preview-heading">
              <div>
                <span className="eyebrow">PRODUCT PREVIEW</span>
                <h2>Explore the analysis experience.</h2>
              </div>
              <MagneticButton kind="secondary" onClick={() => navigate('/detection')}>
                Open New Analysis →
              </MagneticButton>
            </div>

            <div className="full-product-mock verdant-glass-panel">
              <aside>
                <b>AI Verify</b>
                <span>Overview</span>
                <span className="active">New Analysis</span>
                <span>Scan History</span>
                <span>Reports</span>
                <small>Intelligence</small>
                <span>AI Advisor</span>
              </aside>
              <div className="mock-workspace">
                <header>
                  New Analysis <Badge>ILLUSTRATIVE DATA</Badge>
                </header>
                <main>
                  <div className="mock-editor">
                    <span>Text input</span>
                    <p>Paste or write the content you want to analyze...</p>
                    <footer>
                      1,284 words <b>Analyze content</b>
                    </footer>
                  </div>
                  <div className="mock-evidence">
                    <Badge tone="amber">SAMPLE RESULT</Badge>
                    <strong>68%</strong>
                    <p>AI-associated patterns likely</p>
                    <i />
                    <small>Review score limitations before drawing conclusions.</small>
                  </div>
                </main>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Potential Uses */}
        <ScrollReveal y={35}>
          <section className="use-cases" id="about">
            <div>
              <span className="eyebrow">POTENTIAL USES</span>
              <h2>Built for people who need to look closer.</h2>
            </div>
            <div className="use-grid">
              {[
                ['Content creators', 'Review drafts and examine how writing patterns appear.'],
                ['Students & educators', 'Explore detection results as one part of a broader review.'],
                ['Researchers', 'Study generated content and model-observed signals.'],
                ['Professionals', 'Review submitted material with clearer context.'],
              ].map(([a, b]) => (
                <article key={a}>
                  <span>↗</span>
                  <h3>{a}</h3>
                  <p>{b}</p>
                </article>
              ))}
            </div>
            <p className="use-note">
              These are potential uses, not endorsements of fitness for high-stakes decisions. Results should not be used alone to judge authorship or misconduct.
            </p>
          </section>
        </ScrollReveal>

        {/* Limitations */}
        <ScrollReveal y={30}>
          <section className="limitation-section" id="limitations">
            <div>
              <span className="eyebrow">RESPONSIBLE BY DESIGN</span>
              <h2>Designed for informed decisions, not blind certainty.</h2>
            </div>
            <div className="limitation-list">
              <p>Detection results are estimates, not definitive proof.</p>
              <p>Human-written content may be incorrectly flagged.</p>
              <p>AI-generated content may not always be detected.</p>
              <p>Every score requires context and careful interpretation.</p>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ with Framer Motion Accordion */}
        <ScrollReveal y={30}>
          <section className="faq-section">
            <div>
              <span className="eyebrow">FREQUENTLY ASKED</span>
              <h2>Questions deserve clear answers.</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                  >
                    <span>{question}</span>
                    <b>{openFaq === index ? '−' : '+'}</b>
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p>{answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Landing CTA with Citrine Accent Magnetic Button */}
        <ScrollReveal y={35}>
          <section className="landing-cta">
            <span className="eyebrow">START WITH THE EVIDENCE</span>
            <h2>Make your next analysis more understandable.</h2>
            <p>Explore your content, review the available findings, and make better-informed decisions.</p>
            <div className="button-row">
              <MagneticButton kind="citrine" onClick={() => navigate('/detection')}>
                Try AI Verify →
              </MagneticButton>
              <MagneticButton kind="secondary" onClick={() => navigate('/dashboard')}>
                Explore the product
              </MagneticButton>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <footer className="landing-footer">
        <div>
          <div className="landing-brand">
            <img
              src="/logo.png"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.svg'; }}
              alt="AI Verify"
              style={{ width: 30, height: 30, objectFit: 'contain' }}
            />
            <span>AI Verify</span>
          </div>
          <p>Pattern analysis for thoughtful human review.</p>
        </div>
        <div>
          <b>Product</b>
          <button onClick={() => navigate('/detection')}>Text analysis</button>
          <button onClick={() => navigate('/advisor')}>AI Advisor</button>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('#features'); }}>Features</a>
        </div>
        <div>
          <b>Learn</b>
          <a href="#method" onClick={(e) => { e.preventDefault(); scrollTo('#method'); }}>How it works</a>
          <button onClick={() => navigate('/how-it-works')}>Detection limitations</button>
          <a href="https://github.com/SanketP2003/AI_Detection" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
        </div>
        <span>© {new Date().getFullYear()} AI Verify</span>
      </footer>
    </div>
  );
}
