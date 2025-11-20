import React, { Suspense } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DetectorForm from '../components/DetectorForm';
import FloatingShapes3D from '../components/FloatingShapes3D';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

function Detector() {
  // Tips to show users
  const helpTips = [
    {
      icon: CheckCircle,
      title: 'Complete Context',
      content: 'Feed cohesive paragraphs over fragments for sharper scoring.'
    },
    {
      icon: AlertTriangle,
      title: 'Confidence Range',
      content: 'Scores over 75% deserve manual review before final decisions.'
    },
    {
      icon: Info,
      title: 'Privacy First',
      content: 'Inputs stream through memoryless pipelines and never persist.'
    }
  ];

  const processSteps = [
    {
      title: 'Signal mapping',
      desc: 'We isolate cadence, burstiness, and entropy to establish a baseline signature.'
    },
    {
      title: 'Pattern triage',
      desc: 'Anomaly hunters score suspect tokens and cross-check with known AI fingerprints.'
    },
    {
      title: 'Confidence board',
      desc: 'We assemble a concise board with confidence, metrics, and callouts for review.'
    }
  ];

  return (
    <div className="min-h-screen bg-night text-gray-text">
      <Header />

      <main className="pt-28 pb-24">
        {/* Hero Section */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-shell grid-overlay grain">
            <Suspense fallback={null}>
              <FloatingShapes3D />
            </Suspense>

            <div className="relative z-10 flex flex-col gap-12">
              <motion.div
                className="text-center space-y-6 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-carbon/70 text-sm text-mist">
                  <Shield className="h-4 w-4 text-accent" />
                  Trusted AI Detector
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-space text-white leading-tight">
                  Minimal signals. Max confidence.
                </h1>
                <p className="text-base sm:text-lg text-mist/80">
                  Drop in text and get a calm, explainable verdict powered by our multi-model scoring stack.
                </p>
              </motion.div>

              <DetectorForm />

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
              >
                {helpTips.map((tip) => (
                  <div key={tip.title} className="glass-panel p-5 h-full flex flex-col gap-3 border-white/5">
                    <tip.icon className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-white font-space text-lg">{tip.title}</p>
                      <p className="text-mist/80 text-sm leading-relaxed">{tip.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-shell grid-overlay">
            <div className="relative z-10 space-y-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <p className="text-sm uppercase tracking-[0.3em] text-mist/60">Process</p>
                <h2 className="text-3xl sm:text-4xl font-space text-white">How detection unfolds</h2>
                <p className="text-mist/80">
                  Our pipeline layers statistical variance checks, transformer heuristics, and writing fingerprint analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {processSteps.map((step, idx) => (
                  <motion.div
                    key={step.title}
                    className="glass-panel border-white/5 p-6 flex flex-col gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span className="text-xs tracking-[0.4em] text-mist/60">0{idx + 1}</span>
                    <p className="text-white font-space text-xl">{step.title}</p>
                    <p className="text-sm text-mist/80 leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Detector;
