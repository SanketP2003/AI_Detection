import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { Globe, Building, Zap, Lock, Blocks } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function Enterprise() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] -z-10" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] -translate-y-1/2 opacity-20 pointer-events-none -z-10 bg-gradient-to-tr from-purple-400 to-transparent dark:from-purple-600 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />

      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-8 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial="initial" animate="animate" className="space-y-8 md:space-y-10">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest">
              <Building className="w-4 h-4" /> Enterprise Grade
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="font-display text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-gradient">
              Scale without <br /> bottlenecks.
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
              High-throughput APIs designed for seamless integration into CMS pipelines, LMS platforms, and publishing architectures.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 pt-6">
              <button className="w-full sm:w-auto bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-4 rounded-full text-sm font-bold shadow-2xl hover:scale-105 transition-transform">
                Contact Sales
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold glass-card hover:bg-white/80 dark:hover:bg-[#222]/80 transition-colors">
                View API Docs
              </button>
            </motion.div>
          </motion.div>

          <div className="perspective-[1500px]">
            <motion.div 
              initial={{ opacity: 0, rotateY: -15, scale: 0.9 }} 
              animate={{ opacity: 1, rotateY: 0, scale: 1 }} 
              transition={{ duration: 1.5, ease: "easeOut" }} 
              className="relative glass-card p-6 md:p-10 rounded-[3rem] shadow-2xl"
            >
              <div className="space-y-4 md:space-y-6">
                {[
                  { label: 'Latency', value: '11ms', icon: Zap },
                  { label: 'Uptime SLA', value: '99.99%', icon: Globe },
                  { label: 'Concurrent Scans', value: '10,000+', icon: Blocks },
                  { label: 'Data Retention', value: '0 Days', icon: Lock },
                ].map((stat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                    key={i} 
                    className="flex items-center justify-between p-4 md:p-6 rounded-2xl bg-white/50 dark:bg-black/50 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <span className="font-semibold text-base md:text-lg text-neutral-600 dark:text-neutral-400">{stat.label}</span>
                    </div>
                    <span className="font-display text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
