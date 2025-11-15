import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Bot, Users, Target, Award, Zap } from 'lucide-react';

const About = () => {
  const values = [
    { icon: Shield, title: 'Trust & transparency', desc: 'Clear signals and honest methods—no black boxes.' },
    { icon: Bot, title: 'Iterate & improve', desc: 'We ship small, verify often, and keep the UI calm.' },
    { icon: Users, title: 'People first', desc: 'Built for educators, editors, and review teams.' },
  ];

  const stats = [
    { icon: Target, number: '99.2%', label: 'detection accuracy' },
    { icon: Users, number: '10K+', label: 'active reviewers' },
    { icon: Award, number: '50M+', label: 'tokens analyzed' },
    { icon: Zap, number: '24/7', label: 'availability' },
  ];

  return (
    <div className="min-h-screen bg-night text-gray-text">
      <Header />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-6xl font-space text-white">Why AI Guardian</h1>
              <p className="text-lg sm:text-xl text-mist/80 mt-4">
                Minimal tools for evaluating synthetic content—built for clarity, trust, and speed.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission + Stats */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 items-start">
            <motion.div
              className="section-shell"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-space text-white">Our mission</h2>
              <p className="text-mist/80 mt-4">
                As AI writing models evolve, reviewers need quiet interfaces and reliable heuristics to measure authenticity.
                We provide a small toolkit that surfaces just the right metrics, so you can make confident calls without noise.
              </p>
              <p className="text-mist/80 mt-3">
                From classroom submissions to editorial review, we help teams keep standards high with explainable signals.
              </p>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-white/10 bg-white/5 p-8"
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-5">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    className="glass-panel border-white/10 p-5 text-center"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <s.icon className="h-6 w-6 text-white mx-auto mb-3" />
                    <div className="text-2xl font-space font-semibold text-white">{s.number}</div>
                    <div className="text-xs uppercase tracking-[0.3em] text-mist/70 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-space text-white">Principles</h2>
              <p className="text-mist/80 mt-3">The design and engineering choices that shape every release.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  className="glass-panel border-white/10 p-6 text-center"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <v.icon className="h-6 w-6 text-white mx-auto mb-4" />
                  <p className="text-white font-space text-lg">{v.title}</p>
                  <p className="text-sm text-mist/80 mt-2">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 items-center">
            <motion.div
              className="section-shell"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-space text-white">Technology choices</h2>
              <ul className="mt-4 space-y-3 text-mist/80">
                {['Ensemble modeling for robust signals', 'Adaptive thresholds per domain', 'Continuous evaluation sets', 'Privacy-first architecture'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-white/10 bg-white/5 p-8"
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[{ k: 'Accuracy', v: '99.2%' }, { k: 'Latency', v: '<2s' }, { k: 'Languages', v: '25+' }, { k: 'Uptime', v: '99.9%' }].map(({ k, v }) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-white font-semibold">{k}</div>
                    <div className="text-mist/80">{v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-shell text-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl sm:text-4xl font-space text-white">See it in practice</h3>
                <p className="text-mist/80 mt-3">Run a detection or try the advisor—your content never persists.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.a href="/detector" className="px-6 py-3 rounded-xl bg-white text-black font-space text-sm uppercase tracking-[0.35em]" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    Try detector
                  </motion.a>
                  <motion.a href="/chat" className="px-6 py-3 rounded-xl border border-white/15 text-white font-space text-sm uppercase tracking-[0.35em] hover:bg-white/5" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    Open advisor
                  </motion.a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
