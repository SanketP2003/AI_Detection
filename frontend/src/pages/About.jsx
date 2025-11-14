import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Bot, Users, Target, Award, Zap } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'We believe in providing clear, honest insights about AI detection with full transparency in our methods.'
    },
    {
      icon: Bot,
      title: 'Innovation',
      description: 'Continuously advancing our AI technology to stay ahead of evolving content generation techniques.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building tools that serve educators, content creators, and professionals in maintaining content integrity.'
    }
  ];

  const stats = [
    { icon: Target, number: '99.2%', label: 'Detection Accuracy' },
    { icon: Users, number: '10K+', label: 'Active Users' },
    { icon: Award, number: '50M+', label: 'Content Analyzed' },
    { icon: Zap, number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                About AI Guardian
              </h1>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                We're on a mission to help people navigate the evolving landscape of AI-generated content 
                with confidence, transparency, and intelligent tools that empower informed decision-making.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  As artificial intelligence becomes increasingly sophisticated in content generation, 
                  the need for reliable detection and advisory services has never been more critical. 
                  We bridge this gap by providing cutting-edge tools that help maintain content authenticity 
                  and integrity across digital platforms.
                </p>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Our platform serves educators verifying student work, content creators ensuring originality, 
                  and professionals maintaining quality standards in an AI-driven world.
                </p>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={index}
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <stat.icon className="h-8 w-8 text-white mx-auto mb-3" />
                        <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                        <div className="text-gray-400 text-sm">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">Our Values</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                The principles that guide everything we do and every decision we make.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <value.icon className="h-12 w-12 text-white mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-20 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-white mb-6">Advanced Technology</h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Our AI detection system combines multiple advanced techniques including natural language processing, 
                  pattern recognition, and machine learning algorithms trained on diverse datasets to provide 
                  accurate and reliable results.
                </p>
                <div className="space-y-4">
                  {[
                    'Multi-layered neural network analysis',
                    'Real-time pattern recognition',
                    'Continuous model improvement',
                    'Privacy-first processing'
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-4">AI</div>
                    <div className="text-xl text-gray-400 mb-6">Powered Detection</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold">Accuracy</div>
                        <div className="text-gray-400">99.2%</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold">Speed</div>
                        <div className="text-gray-400">&lt;2s</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold">Languages</div>
                        <div className="text-gray-400">25+</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-white font-semibold">Uptime</div>
                        <div className="text-gray-400">99.9%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Experience AI Guardian?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join thousands of users who trust our platform for reliable AI content detection and advisory services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/detector"
                  className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try AI Detector
                </motion.a>
                <motion.a
                  href="/chat"
                  className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Chat with AI
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;

