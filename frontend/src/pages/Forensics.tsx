import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { Search, BrainCircuit, Activity } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function Forensics() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] -z-10" />
      <div className="absolute -top-40 right-[-20%] w-[1000px] h-[800px] opacity-20 pointer-events-none -z-10 bg-gradient-to-bl from-blue-400 to-transparent dark:from-blue-600 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-8 py-24 md:py-32 text-center relative z-10">
          <motion.div initial="initial" animate="animate" className="space-y-8">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest">
              <Search className="w-4 h-4" /> Deep Inspection
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-gradient">
              Forensic-level <br /> <span className="text-neutral-400 dark:text-neutral-600">Sentence Analysis.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
              We decompose digital text into its mathematical properties, providing objective evidence for automated/synthetic origins. Not just a score—proof.
            </motion.p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-8 pb-32 md:pb-40 relative z-10 perspective-[1000px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <motion.div 
              initial={{ opacity: 0, rotateX: 10, y: 50 }} 
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }} 
              transition={{ duration: 1, ease: 'easeOut' }}
              viewport={{ once: true }} 
              className="glass-card p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 text-neutral-200/50 dark:text-neutral-800/50 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <BrainCircuit className="w-48 h-48" />
              </div>
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mb-8 shadow-xl">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 relative z-10">Stylometric Fingerprinting</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-base md:text-lg max-w-sm relative z-10 font-medium">
                Our engine analyzes burstiness and perplexity across 128 different dimensions to separate human cadence from stochastic parrots.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, rotateX: 10, y: 50 }} 
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }} 
              transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
              viewport={{ once: true }} 
              className="glass-card p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 text-neutral-200/50 dark:text-neutral-800/50 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Activity className="w-48 h-48" />
              </div>
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mb-8 shadow-xl">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 relative z-10">Perplexity Mapping</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-base md:text-lg max-w-sm relative z-10 font-medium">
                Visualize the predictability of every sentence. We map the statistical likelihood of token sequences to expose generated structures.
              </p>
            </motion.div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
