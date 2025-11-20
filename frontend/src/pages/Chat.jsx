import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatInterface from '../components/ChatInterface';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, Lightbulb, HelpCircle, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';

const Chat = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Natural dialogue',
      description: 'Converse without visual clutter. The AI adapts to your tone and intent.',
    },
    {
      icon: Lightbulb,
      title: 'Context memory',
      description: 'We surface prior responses inline so you can stay in flow.',
    },
    {
      icon: HelpCircle,
      title: 'Instant references',
      description: 'Pull explainers and tips without leaving the chat shell.',
    }
  ];

  const capabilities = [
    {
      icon: Shield,
      title: 'Detection coaching',
      description: 'Understand AI signals and how reviewers probe authenticity.',
    },
    {
      icon: Zap,
      title: 'Fast drafts',
      description: 'Turn messy thoughts into clean, human-first copy in seconds.',
    },
    {
      icon: TrendingUp,
      title: 'Tone adjust',
      description: 'Dial writing warmth up or down for any brief.',
    },
  ];

  const sampleQuestions = [
    'How can I disguise repetitive cadence in my writing?',
    'What does a low burstiness score really imply?',
    'How strict are AI detectors with academic essays?',
    'Give me a checklist before I submit AI-assisted copy.',
  ];

  return (
    <div className="min-h-screen bg-night text-gray-text">
      <Header />

      <main className="pt-28 pb-24">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-shell grid-overlay grain">
            <div className="relative z-10 flex flex-col gap-12">
              <motion.div
                className="flex flex-col items-center text-center gap-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-carbon/70 text-sm text-mist">
                  <Bot className="h-4 w-4 text-accent" />
                  Chat advisor
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-space text-white leading-tight max-w-3xl">
                  Ask quiet questions. Get precise guidance.
                </h1>
                <p className="text-base sm:text-lg text-mist/80 max-w-2xl">
                  A distraction-free chat space for authenticity coaches, editors, and teams staying ahead of AI signatures.
                </p>
              </motion.div>

              <ChatInterface />
            </div>
          </div>
        </section>

        <section className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-12">
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="glass-panel border-white/5 p-6 flex flex-col gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
              >
                <feature.icon className="h-5 w-5 text-accent" />
                <p className="text-lg font-space text-white">{feature.title}</p>
                <p className="text-sm text-mist/80 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="glass-panel border-white/5 p-8 grid md:grid-cols-3 gap-6">
            {capabilities.map((capability) => (
              <div key={capability.title} className="flex flex-col gap-3 border border-white/5 rounded-2xl p-4">
                <capability.icon className="h-5 w-5 text-white" />
                <p className="text-white font-space text-lg">{capability.title}</p>
                <p className="text-sm text-mist/80">{capability.description}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel border-white/5 p-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-mist/60">
              <Sparkles className="h-4 w-4" />
              Try asking
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {sampleQuestions.map((question) => (
                <motion.div
                  key={question}
                  className="border border-white/10 rounded-2xl p-4 text-sm text-white/90 hover:border-white/40 transition-colors"
                  whileHover={{ y: -4 }}
                >
                  {question}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;