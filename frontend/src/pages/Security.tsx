import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { ShieldAlert, Fingerprint, RefreshCcw, EyeOff } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function Security() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] -z-10" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 dark:bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-screen" />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-8 py-24 md:py-32 text-center relative z-10">
          <motion.div initial="initial" animate="animate" className="space-y-8">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shadow-xl shadow-emerald-500/10">
              <ShieldAlert className="w-4 h-4" /> Zero Trust Architecture
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-gradient">
              Your content is <br /> <span className="text-emerald-600 dark:text-emerald-500">invisible to us.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
              We process data ephemerally in memory. No logs, no retention, and absolutely no training on your proprietary information.
            </motion.p>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-8 pb-32 md:pb-40 relative z-10 perspective-[1000px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: EyeOff, title: "Zero Retention", desc: "Data exists only for the millisecond it takes to analyze. Once the response is sent over TLS, memory is purged." },
              { icon: Fingerprint, title: "No Model Training", desc: "Unlike our competitors, we legally guarantee we will never train our algorithmic models on your scanned content." },
              { icon: RefreshCcw, title: "SOC 2 Type II", desc: "Continually audited and monitored by third-party security firms to ensure absolute compliance and data hygiene." },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, rotateX: 10, y: 50 }} 
                whileInView={{ opacity: 1, rotateX: 0, y: 0 }} 
                transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="glass-card p-8 md:p-10 rounded-[2.5rem] flex flex-col hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="w-16 h-16 bg-white dark:bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-neutral-200/50 dark:border-neutral-700/50">
                  <feature.icon className="w-8 h-8 text-neutral-900 dark:text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
