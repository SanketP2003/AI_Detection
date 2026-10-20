import { PageTitle, Button } from '../components/CommonUI';
import { useNavigate } from 'react-router-dom';

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="page editorial">
      <PageTitle
        eyebrow="METHODOLOGY & LIMITATIONS"
        title="Understand the signal. Keep the context."
        copy="AI detection is a probabilistic assessment of patterns—not a definitive judgment about authorship."
        action={
          <Button onClick={() => navigate('/detection')}>
            Try an analysis →
          </Button>
        }
      />

      <section className="method-steps">
        {[
          [
            '01',
            'Content is prepared',
            'We normalize the submitted text while preserving the linguistic features, syntactic structures, and token distributions relevant to forensic analysis.',
          ],
          [
            '02',
            'Patterns are evaluated',
            'The engine compares language predictability (perplexity), sentence cadence variation (burstiness), structural repetition, and vocabulary distribution to reference corpuses.',
          ],
          [
            '03',
            'Signals are contextualized',
            'Results combine contributing indicators into an interpretable model score with clear confidence notes and limitations rather than an opaque verdict.',
          ],
        ].map(([num, headline, desc]) => (
          <article key={num}>
            <span>{num}</span>
            <h3>{headline}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <div className="content-columns">
        <section>
          <span className="eyebrow">HOW TO INTERPRET RESULTS</span>
          <h2>A score starts a review. It does not end one.</h2>
          <p>
            Detection models can be influenced by editing style, language proficiency, technical or formulaic writing, short samples, and model drift. Human-authored text can receive an elevated score, and AI-generated text can receive a low one.
          </p>
          <p style={{ marginTop: 16 }}>
            Treat every assessment as an initial hypothesis. Always triangulate findings with drafting history, source attribution, and personal human dialogue.
          </p>
        </section>

        <section className="principles">
          <div>
            <b>Use sufficient text</b>
            <span>Longer samples (minimum 25–100 words) generally provide significantly more stable and reliable statistical signals.</span>
          </div>
          <div>
            <b>Review the breakdown</b>
            <span>Look beyond the overall number to understand which specific contributing patterns influenced the assessment.</span>
          </div>
          <div>
            <b>Protect high-stakes decisions</b>
            <span>Never use an automated score as the sole basis for punitive academic, employment, disciplinary, or legal action.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
