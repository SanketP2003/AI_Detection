import { ArrowRight, Zap, Cpu, Lock, Activity, Blocks, Shield, CheckCircle2, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function Dashboard3DMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-24 mb-10 perspective-[2000px] z-10">
      <motion.div
        animate={{
          rotateX: [6, 10, 6],
          rotateY: [-3, 3, -3],
          y: [-6, 6, -6],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="w-full glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-neutral-200/50 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl"
      >
        {/* Top Control Bar */}
        <div className="flex border-b border-neutral-200/50 dark:border-neutral-800/50 p-4 items-center gap-4 bg-white/40 dark:bg-black/30 backdrop-blur-md">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-400/70 dark:bg-red-500/30" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/70 dark:bg-amber-500/30" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/70 dark:bg-emerald-500/30" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-neutral-100 dark:bg-neutral-900/60 rounded-full px-16 py-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tracking-widest border border-neutral-200/30 dark:border-neutral-800/50">
              guardian-core-analysis-dashboard
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Mockup Dashboard Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-neutral-50/20 dark:bg-[#060606]/20">

          {/* Left Metrics column */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-neutral-200/40 dark:border-neutral-800/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Real-time status</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-neutral-900 dark:text-white">Active</span>
                <span className="text-xs font-mono text-emerald-500">11ms latency</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-neutral-200/40 dark:border-neutral-800/50 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
              <div className="relative aspect-square w-32 rounded-full border-4 border-emerald-500/10 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-emerald-500/30 rounded-full border-t-emerald-500"
                />
                <span className="font-display text-3xl font-black text-neutral-900 dark:text-white">98.2%</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-1">Pattern Match</span>
              </div>
            </div>
          </div>

          {/* Right Chart & Content Column */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-neutral-200/40 dark:border-neutral-800/50 flex-1 space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-200/30 dark:border-neutral-800/30 pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Linguistic Variance Plot</h3>
                  <p className="text-[10px] text-neutral-500 font-medium">Linguistic perplexity patterns mapping across document</p>
                </div>
                <div className="text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 rounded-full font-bold">
                  Entropy: High
                </div>
              </div>

              {/* Simulated Wave Plot */}
              <div className="h-40 w-full relative flex items-end justify-between px-2 pt-6">
                {/* Visual grid lines */}
                <div className="absolute inset-x-0 top-1/4 border-t border-neutral-200/10 dark:border-neutral-800/30" />
                <div className="absolute inset-x-0 top-2/4 border-t border-neutral-200/10 dark:border-neutral-800/30" />
                <div className="absolute inset-x-0 top-3/4 border-t border-neutral-200/10 dark:border-neutral-800/30" />

                {/* Simulated Chart Bars */}
                {[40, 55, 35, 70, 90, 65, 45, 80, 95, 75, 50, 85, 60, 40, 75].map((val, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
                    className="w-[5%] rounded-t bg-gradient-to-t from-emerald-500 to-blue-500 opacity-80"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 glass-card rounded-xl p-4 border border-neutral-200/30 dark:border-neutral-800/30 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>Scanning throughput</span>
                <span className="font-bold text-neutral-900 dark:text-white">12,500 words/s</span>
              </div>
              <div className="flex-1 glass-card rounded-xl p-4 border border-neutral-200/30 dark:border-neutral-800/30 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>Verification confidence</span>
                <span className="font-bold text-neutral-900 dark:text-white">99.98%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-35 dark:opacity-10 pointer-events-none -z-10 bg-gradient-to-b from-blue-400 to-emerald-400 dark:from-emerald-600 dark:to-blue-900 blur-[130px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[10000ms]" />

      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 pt-24 md:pt-32 pb-20 text-center relative z-10">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8 md:space-y-10">
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-black/50 backdrop-blur-md text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Engine v3.0 Deployment Active
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="font-display text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] text-neutral-900 dark:text-white"
            >
              Verify <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500">the truth.</span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed font-semibold"
            >
              The enterprise standard for content authenticity. Transform your risk management with forensic-level algorithmic detection.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link to="/signup" className="w-full sm:w-auto relative group overflow-hidden bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-4 rounded-full text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                <div className="absolute inset-0 w-full h-full bg-white/20 dark:bg-black/10 transition-transform -translate-x-full group-hover:translate-x-full duration-500 ease-out" />
                Deploy Guardian <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/product" className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold glass-card hover:bg-white/80 dark:hover:bg-[#222]/80 transition-all text-neutral-900 dark:text-white border border-neutral-200/50">
                Explore Products
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
            <Dashboard3DMockup />
          </motion.div>
        </section>

        {/* Partners Banner */}
        <section className="py-20 relative z-10 border-y border-neutral-200/50 dark:border-neutral-800/50 bg-white/30 dark:bg-black/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-center text-[10px] sm:text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.3em] mb-12">Securing infrastructure for industry leaders</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-x-24 gap-y-12 opacity-60 dark:opacity-40 grayscale transition-opacity hover:grayscale-0 hover:opacity-100 duration-500">
              <span className="font-display font-black text-2xl tracking-tighter">ACME CORP</span>
              <span className="font-display font-bold text-2xl tracking-tight text-nowrap">GLOBAL NET</span>
              <span className="font-display font-medium text-2xl italic tracking-[0.2em]">STARK</span>
              <span className="font-display font-black text-2xl tracking-[0.1em]">WAYNE</span>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 text-center md:text-left">
              <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-neutral-900 dark:text-white">
                Architected for scale.
              </h2>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl font-semibold">
                Our infrastructure guarantees zero-retention ephemeral processing, sub-millisecond latency, and mathematically sound truth verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Bento Card 1 (Large 2-column) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="md:col-span-2 glass-card rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative border border-neutral-200/30 dark:border-neutral-800/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity dark:text-white pointer-events-none">
                  <Cpu className="w-56 h-56" />
                </div>
                <div className="w-14 h-14 bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center justify-center mb-12 shadow-lg">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-extrabold tracking-tight mb-4 text-neutral-900 dark:text-white">Neural Acceleration</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed max-w-lg font-medium">
                    We developed custom inference pathways that reduce analysis time to under 12ms per request. Keep user flow uninterrupted with absolute security.
                  </p>
                </div>
              </motion.div>

              {/* Bento Card 2 (Standard 1-column) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="glass-card rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative border border-neutral-200/30 dark:border-neutral-800/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-8">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight mb-3 text-neutral-900 dark:text-white">Zero Retention</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-semibold">
                    Your data exists in RAM just long enough to analyze. Fully ephemeral. We do not store, leak, or train models on your proprietary IP.
                  </p>
                </div>
              </motion.div>

              {/* Bento Card 3 (Standard 1-column) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="glass-card rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative border border-neutral-200/30 dark:border-neutral-800/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-8">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight mb-3 text-neutral-900 dark:text-white">Sentence Highlights</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-semibold">
                    Pinpoint classification down to paragraph chunks and individual sentences. Highlights display custom probability metrics dynamically.
                  </p>
                </div>
              </motion.div>

              {/* Bento Card 4 (Large 2-column with mock editor code visual) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="md:col-span-2 glass-card rounded-[2.5rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 group overflow-hidden relative border border-neutral-200/30 dark:border-neutral-800/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex-1 space-y-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">API-First Integrations</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-semibold">
                      Deploy our detection services directly into CMS workflows, classroom management portals, or chat channels with one lightweight endpoint.
                    </p>
                  </div>
                </div>
                <div className="w-full lg:w-1/2 p-6 bg-neutral-950 dark:bg-black rounded-2xl border border-neutral-200/10 dark:border-neutral-800/50 shadow-2xl relative z-10">
                  <div className="flex gap-1.5 border-b border-neutral-800/50 pb-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-850" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-850" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-850" />
                  </div>
                  <pre className="text-[10px] sm:text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto">
                    <code>
                      {`POST /v2/analyze
{
  "content": "Sample document...",
  "strict": true,
  "webhook_url": "..."
}

Response (12ms):
{
  "similarity_score": 0.98,
  "status": "VERIFIED"
}`}
                    </code>
                  </pre>
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
