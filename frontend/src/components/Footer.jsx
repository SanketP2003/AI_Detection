import React from 'react';
import {Github, Linkedin, Mail} from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: 'mailto:1002sanketpatil@gmail.com', label: 'Email' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-carbon/95 border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg md:text-xl font-space font-semibold text-white mb-3 md:mb-4">
                AI <span className="text-accent">Guardian</span>
              </h3>
              <p className="text-mist/80 font-inter mb-5 max-w-md text-sm md:text-base leading-relaxed">
                Minimal tools for serious reviewers. Detect synthetic content and surface insights with calm clarity.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="text-mist/70 hover:text-white transition-colors duration-300 p-2 rounded-xl border border-white/5 hover:border-white/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-base md:text-lg font-space font-semibold text-white mb-3 md:mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-mist/80">
                <li>
                  <a href="/detector" className="hover:text-white transition-colors duration-300">
                    AI Content Detection
                  </a>
                </li>
                <li>
                  <a href="/chat" className="hover:text-white transition-colors duration-300">
                    Chat Advisor
                  </a>
                </li>
                <li>
                  <button type="button" className="hover:text-white transition-colors duration-300 text-left">
                    API Access
                  </button>
                </li>
              </ul>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-base md:text-lg font-space font-semibold text-white mb-3 md:mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-mist/80">
                <li>
                  <button type="button" className="hover:text-white transition-colors duration-300 text-left">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-white transition-colors duration-300 text-left">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-white transition-colors duration-300 text-left">
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-mist/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="font-inter text-center sm:text-left">
            © 2025 AI Guardian. All rights reserved.
          </p>
          <p className="font-inter text-center sm:text-right">
            Built with <span className="text-accent">care</span> for authenticity and trust.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;