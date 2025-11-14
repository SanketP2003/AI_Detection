import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Bot, Zap, Users, Globe, Lock } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Shield,
      title: 'Advanced AI Detection',
      description: 'State-of-the-art algorithms to identify AI-generated content with high accuracy and detailed analysis.'
    },
    {
      icon: Bot,
      title: 'Intelligent Chat Advisor',
      description: 'Get personalized advice and insights from our AI-powered chat system for all your content needs.'
    },
    {
      icon: Zap,
      title: 'Real-time Analysis',
      description: 'Instant results with comprehensive breakdowns of content authenticity and generation patterns.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share results and collaborate with your team to maintain content quality and authenticity.'
    },
    {
      icon: Globe,
      title: 'Multi-language Support',
      description: 'Detect AI-generated content across multiple languages with consistent accuracy.'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Your content is processed securely and never stored or shared with third parties.'
    }
  ];

  const stats = [
    { number: '99.2%', label: 'Detection Accuracy' },
    { number: '50M+', label: 'Content Analyzed' },
    { number: '10K+', label: 'Active Users' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-pure-black">
      <Header />
      <Hero />
      
      {/* Features Section */}
      <section className="py-12 md:py-20 bg-pure-black relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-accent/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-space text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
              Powerful Features for
              <span className="block bg-gradient-to-r from-purple-primary via-purple-accent to-purple-light bg-clip-text text-transparent mt-2">
                Content Authenticity
              </span>
            </h2>
            <p className="font-inter text-base md:text-xl text-gray-secondary max-w-3xl mx-auto px-4">
              Our comprehensive suite of AI-powered tools helps you maintain content integrity
              and make informed decisions about digital content.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-purple-primary/5 backdrop-blur-sm rounded-xl border border-purple-primary/20 p-6 md:p-8 hover:bg-purple-primary/10 hover:border-purple-primary/40 transition-all duration-300 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="p-3 rounded-lg bg-purple-primary/10 group-hover:bg-purple-primary/20 transition-colors duration-300 inline-block mb-4 md:mb-6">
                  <feature.icon className="h-10 w-10 md:h-12 md:w-12 text-purple-primary group-hover:text-purple-light transition-colors duration-300" />
                </div>
                <h3 className="text-lg md:text-xl font-space font-bold text-white mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-gray-secondary leading-relaxed font-inter text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-purple-primary/5 border-y border-purple-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-space text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
              Trusted by Thousands
            </h2>
            <p className="font-inter text-base md:text-xl text-gray-secondary px-4">
              Join the community of content creators, educators, and professionals who trust AI Guardian.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-xl bg-purple-primary/5 border border-purple-primary/20 hover:bg-purple-primary/10 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-space font-bold bg-gradient-to-r from-purple-primary to-purple-light bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-secondary font-inter font-medium text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-pure-black relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-purple-primary/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-space text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
              Ready to Get Started?
            </h2>
            <p className="font-inter text-base md:text-xl text-gray-secondary mb-6 md:mb-8 px-4">
              Experience the power of AI-driven content analysis and intelligent advisory services.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <motion.a
                href="/detector"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-gradient-purple text-white font-space font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-primary/50 transition-all duration-300 text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Detecting
              </motion.a>
              <motion.a
                href="/chat"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 border-2 border-purple-primary text-white font-space font-semibold rounded-xl hover:bg-purple-primary/10 hover:shadow-lg hover:shadow-purple-primary/30 transition-all duration-300 text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Chat with AI
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;