import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  esbuild: {
    logOverride: {
      'ignored-directive': 'silent', 
    },
  },
  logLevel: 'info', 
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      onwarn(warning, warn) {
        // ignore certain harmless warnings
        if (
          warning.message.includes('Module level directives') ||
          warning.message.includes('"use client"')  ||
          warning.message.includes('"was ignored"')
        ) {
          return; 
        }

        // FAIL build on unresolved imports
        if (warning.code === 'UNRESOLVED_IMPORT') {
          throw new Error(`Build failed due to unresolved import:\n${warning.message}`);
        }

        // FAIL build on missing exports (like your Input error)
        if (warning.code === 'PLUGIN_WARNING' && /is not exported/.test(warning.message)) {
          throw new Error(`Build failed due to missing export:\n${warning.message}`);
        }

        // other warnings: log normally
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (!id || !id.includes('node_modules')) return;
          // React core
          if (id.includes('react-dom')) return 'vendor_react-dom';
          if (id.includes('react-router')) return 'vendor_react-router';
          if (id.includes('react')) return 'vendor_react';

          // Three.js ecosystem
          if (id.includes('three')) return 'vendor_three';
          if (id.includes('@react-three/fiber')) return 'vendor_r3f';
          if (id.includes('@react-three/drei')) return 'vendor_drei';

          // Animation and charts
          if (id.includes('framer-motion')) return 'vendor_motion';
          if (id.includes('recharts')) return 'vendor_charts';

          // Icons
          if (id.includes('lucide-react')) return 'vendor_icons';
        },
      },
    },
  },
});