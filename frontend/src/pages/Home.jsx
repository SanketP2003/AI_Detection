import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Bot, Zap, Users, Globe, Lock } from 'lucide-react';

function Home() {
  // Main features to showcase
  const features = [
    { icon: Shield, title: 'Advanced detection', desc: 'Multi-model scoring to spot synthetic patterns with clarity.' },
    { icon: Bot, title: 'Chat advisor', desc: 'A focused assistant for tone, authenticity, and submission prep.' },
    { icon: Zap, title: 'Real-time', desc: 'Fast, calm verdicts with no clutter—just signal.' },
    { icon: Users, title: 'Team-ready', desc: 'Share results, compare runs, and align reviews.' },
    { icon: Globe, title: 'Multi-language', desc: 'Consistent analysis across major languages.' },
    { icon: Lock, title: 'Privacy-first', desc: 'Stateless requests, no content retained.' },
  ];

  // Some stats to display
  const stats = [
    { number: '99.2%', label: 'avg. detection accuracy' },
    { number: '50M+', label: 'tokens analyzed' },
    { number: '10K+', label: 'reviewers onboard' },
    { number: '<2s', label: 'median response' },
  ];

  return (
    <div className="min-h-screen bg-night text-gray-text">
      <Header />
      <Hero />

      {/* Features section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-shell grid-overlay">
            <motion.div
              className="relative z-10 text-center max-w-3xl mx-auto mb-12 md:mb-16"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-xs uppercase tracking-[0.4em] text-mist/60 mb-3">Platform</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-space text-white">Quiet tools. Clear signal.</h2>
              <p className="text-mist/80 mt-4">Minimal UI for serious reviewers—get confident answers without visual noise.</p>
            </motion.div>

            <div className="relative z-10 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="glass-panel border-white/10 p-5 md:p-6 flex flex-col gap-3"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                  <p className="text-white font-space text-lg">{feature.title}</p>
                  <p className="text-sm text-mist/80 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="text-2xl md:text-3xl font-space font-semibold text-white">{stat.number}</div>
                <div className="text-xs uppercase tracking-[0.3em] text-mist/70 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-shell">
            <motion.div
              className="relative z-10 text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl sm:text-4xl font-space text-white">Start with one calm decision</h3>
              <p className="text-mist/80 mt-3">Run a detection or ask the advisor—no setup, no distractions.</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <motion.a
                  href="/detector"
                  className="px-6 py-3 rounded-xl bg-white text-black font-space text-sm uppercase tracking-[0.35em]"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Run detector
                </motion.a>
                <motion.a
                  href="/chat"
                  className="px-6 py-3 rounded-xl border border-white/15 text-white font-space text-sm uppercase tracking-[0.35em] hover:bg-white/5"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Open advisor
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;