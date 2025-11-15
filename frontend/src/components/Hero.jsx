import React, { Suspense, lazy } from 'react';
import { ArrowRight, Shield, Bot, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
const Hero3D = lazy(() => import('./Hero3D'));

const Hero = () => {
  const features = [
    { icon: Shield, text: 'AI Content Detection' },
    { icon: Bot, text: 'Smart Chat Advisor' },
    { icon: Zap, text: 'Real-time Analysis' },
  ];

  return (
    <section className="relative min-h-screen bg-pure-black flex items-center justify-center overflow-hidden">
      {/* 3D Animated Background */}
      <Suspense fallback={null}>
        <Hero3D />
      </Suspense>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-pure-black/20 via-transparent to-pure-black/80"></div>

      {/* Animated purple glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 md:w-[500px] md:h-[500px] bg-purple-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-purple-light/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-space text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 md:mb-6 leading-tight">
            AI-Powered
            <span className="block bg-gradient-to-r from-purple-primary via-purple-accent to-purple-light bg-clip-text text-transparent mt-2">
              Content Guardian
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="font-inter text-base sm:text-lg md:text-xl lg:text-2xl text-gray-text mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Detect AI-generated content with precision and get intelligent chat advisory 
          services powered by cutting-edge artificial intelligence.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-10 md:mb-12 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            to="/detector"
            className="group inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-gradient-purple text-white font-space font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-primary/50 transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            Try AI Detector
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <Link
            to="/chat"
            className="group inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 border-2 border-purple-primary text-white font-space font-semibold rounded-xl hover:bg-purple-primary/10 hover:shadow-lg hover:shadow-purple-primary/30 transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            Chat Advisor
            <Bot className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform duration-300" />
          </Link>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center p-4 md:p-6 bg-purple-primary/5 backdrop-blur-sm rounded-xl border border-purple-primary/20 hover:bg-purple-primary/10 hover:border-purple-primary/40 transition-all duration-300 group"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            >
              <div className="p-3 rounded-lg bg-purple-primary/10 group-hover:bg-purple-primary/20 transition-colors duration-300 mb-3 md:mb-4">
                <feature.icon className="h-8 w-8 md:h-10 md:w-10 text-purple-primary group-hover:text-purple-light transition-colors duration-300" />
              </div>
              <span className="text-white font-inter font-medium text-sm md:text-base">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-purple-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-2 md:h-3 bg-purple-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;