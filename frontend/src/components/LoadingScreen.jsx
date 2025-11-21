import React from 'react';
import { motion } from 'framer-motion';


function LoadingScreen() {
  const dots = [0, 1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-[#030711] text-white relative overflow-hidden">
      {}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_50%)]" />

      {}
      <motion.div
        className="absolute -top-32 -right-16 w-[420px] h-[420px] bg-sky-500/20 blur-[180px]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
      />
      <motion.div
        className="absolute -bottom-32 -left-10 w-[460px] h-[460px] bg-violet-500/20 blur-[180px]"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-10 px-6 text-center min-h-screen">
        <div className="space-y-6">
          {}
          <div className="relative w-32 h-32 mx-auto">
            {}
            <motion.div
              className="absolute inset-0 rounded-full border border-white/10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            />
            {}
            <motion.div
              className="absolute inset-3 rounded-full border border-white/5"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
            />

            {}
            {dots.map((i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-300 to-cyan-200"
                style={{ transformOrigin: '0 0' }}
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 5.5 + i * 0.6,
                  ease: 'linear',
                  delay: i * 0.35
                }}
              />
            ))}

            {}
            <motion.div
              className="absolute inset-6 rounded-full bg-gradient-to-br from-white/15 to-transparent"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            />

            {}
            <div className="absolute inset-[38%] rounded-full bg-white/90" />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Warming up</p>
            <h1 className="text-3xl md:text-4xl font-space">Give us a sec</h1>
            <p className="text-white/70 max-w-md mx-auto text-sm">
              Spinning up detectors, syncing chat memory, and double-checking the safety rails.
            </p>
          </div>
        </div>

        {}
        <div className="w-full max-w-md space-y-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
              animate={{ x: ['-30%', '110%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between text-[0.65rem] uppercase tracking-[0.35em] text-white/60">
            <span>calibrating</span>
            <span>staging</span>
            <span>ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
