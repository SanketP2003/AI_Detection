import { ArrowRight, Zap, Cpu, Lock, Activity, Blocks } from 'lucide-react';
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
    <div className="relative w-full max-w-5xl mx-auto mt-24 mb-10 perspective-[2000px]">
      <motion.div
        animate={{
          rotateX: [10, 15, 10],
          rotateY: [-5, 5, -5],
          y: [-10, 10, -10],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="w-full glass-panel rounded-[2rem] overflow-hidden"
      >
        <div className="flex border-b border-neutral-200/50 dark:border-neutral-800/50 p-4 items-center gap-4 bg-white/50 dark:bg-black/50">
           <div className="flex gap-2">
             <div className="w-3.5 h-3.5 rounded-full bg-red-400/80 dark:bg-red-500/50"/>
             <div className="w-3.5 h-3.5 rounded-full bg-amber-400/80 dark:bg-amber-500/50"/>
             <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/50"/>
           </div>
           <div className="flex-1 flex justify-center">
             <div className="bg-neutral-200/50 dark:bg-neutral-900/50 rounded-md px-24 py-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tracking-widest">
               guardian-core-analysis-dashboard
             </div>
           </div>
           <div className="w-16" />
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-neutral-50/50 dark:bg-[#0A0A0A]/50 h-auto md:h-[400px]">
           <div className="md:col-span-3 space-y-4">
             <div className="h-8 w-full bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg animate-pulse" />
             <div className="h-8 w-3/4 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg animate-pulse" style={{ animationDelay: '150ms' }} />
             <div className="h-8 w-5/6 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg animate-pulse" style={{ animationDelay: '300ms' }} />
             <div className="pt-8 space-y-4">
               <div className="aspect-square w-full rounded-2xl border-4 border-emerald-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                 <motion.div 
                   animate={{ rotate: 360 }} 
                   transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-[8px] border-emerald-500/30 rounded-full border-t-emerald-500"
                 />
                 <span className="font-display text-4xl font-bold">98%</span>
                 <span className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">AI Detected</span>
               </div>
             </div>
           </div>
           
           <div className="md:col-span-9 space-y-6">
             <div className="flex justify-between items-end">
               <div>
                 <div className="h-4 w-32 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-md mb-2" />
                 <div className="h-8 w-64 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg" />
               </div>
               <div className="h-10 w-32 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/20" />
             </div>
             
             <div className="glass-card rounded-2xl h-full p-6 space-y-4">
               <div className="flex gap-4 items-start">
                 <span className="shrink-0 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold font-mono">01</span>
                 <div className="flex-1 space-y-2">
                   <div className="h-3 w-full bg-emerald-500/20 rounded" />
                   <div className="h-3 w-5/6 bg-emerald-500/20 rounded" />
                 </div>
               </div>
               <div className="flex gap-4 items-start pt-4">
                 <span className="shrink-0 px-2 py-1 bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-500 rounded text-xs font-bold font-mono">02</span>
                 <div className="flex-1 space-y-2">
                   <div className="h-3 w-11/12 bg-neutral-200/50 dark:bg-neutral-800/50 rounded" />
                   <div className="h-3 w-4/6 bg-neutral-200/50 dark:bg-neutral-800/50 rounded" />
                 </div>
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 dark:opacity-10 pointer-events-none -z-10 bg-gradient-to-b from-blue-400 to-emerald-400 dark:from-emerald-600 dark:to-blue-900 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-8 pt-24 md:pt-32 pb-20 text-center relative z-10">
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8 md:space-y-10">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              Engine v3.0 Deployment Active
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="font-display text-5xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.9] text-gradient"
            >
              Verify <br /> the truth.
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              The enterprise standard for content authenticity. Transform your risk management with forensic-level algorithmic detection.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link to="/signup" className="w-full sm:w-auto relative group overflow-hidden bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-4 rounded-full text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                <div className="absolute inset-0 w-full h-full bg-white/20 dark:bg-black/10 transition-transform -translate-x-full group-hover:translate-x-full duration-500 ease-out" />
                Deploy Guardian <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold glass-card hover:bg-white/80 dark:hover:bg-[#222]/80 transition-all text-neutral-900 dark:text-white">
                Explore the API
              </button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}>
            <Dashboard3DMockup />
          </motion.div>
        </section>

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

        <section className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 text-center md:text-left">
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-gradient">
                Architected for scale.
              </h2>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl font-medium mx-auto md:mx-0">
                Our infrastructure guarantees zero-retention ephemeral processing, sub-millisecond latency, and mathematically sound truth verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="md:col-span-2 glass-card rounded-[2rem] p-8 md:p-10 flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity dark:text-white pointer-events-none">
                   <Cpu className="w-64 h-64" />
                </div>
                <div className="relative z-10 w-14 h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center justify-center mb-12 shadow-xl">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-3xl font-bold tracking-tight mb-4">Neural Acceleration</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed max-w-md">
                    We developed custom inference pathways that reduce analysis time to under 15ms per page. Uninterrupted flow, absolute security.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="glass-card rounded-[2rem] p-8 flex flex-col group overflow-hidden relative"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-8">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight mb-3">Zero Retention</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed relative z-10">
                  Your data exists in RAM just long enough to analyze. Fully ephemeral. We do not train on your IP.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="glass-card rounded-[2rem] p-8 flex flex-col group overflow-hidden relative"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-8">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight mb-3">Sentence Level</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed relative z-10">
                  We highlight the exact phrases matched by our models with forensic probability scores.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="md:col-span-2 glass-card rounded-[2rem] p-8 md:p-10 flex flex-col sm:flex-row items-center gap-10 group overflow-hidden relative"
              >
                <div className="flex-1 space-y-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                    <Blocks className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-3xl font-bold tracking-tight">API-First Architecture</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed max-w-sm">
                    Integrate our analysis engine directly into your CMS, LMS, or proprietary platform with one robust RESTful webhook.
                  </p>
                </div>
                <div className="w-full sm:w-1/2 p-6 bg-black dark:bg-[#0A0A0A] rounded-2xl border border-neutral-800 shadow-2xl relative z-10">
                   <pre className="text-[10px] sm:text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto">
                     <code>
{`POST /v2/analyze
{
  "content": "Sample text...",
  "strict": true,
  "webhook_url": "..."
}

Response (12ms):
{
  "ai_probability": 0.98,
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
