/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.jsx",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy palette
        'pure-black': '#000000',
        'purple-primary': '#9333ea',
        'purple-light': '#A855F7',
        'purple-dark': '#7e22ce',
        'purple-accent': '#8B5CF6',
        'gray-text': '#e5e7eb',
        'gray-secondary': '#9ca3af',
        // Minimal black theme palette
        night: '#050505',
        onyx: '#0c0c0f',
        carbon: '#111114',
        graphite: '#1b1b1f',
        steel: '#2a2a31',
        mist: '#9ba1b4',
        accent: '#b080ff',
        accentSoft: '#b8a7ff',
        accentMuted: '#5c5cff',
        warning: '#f6c343',
        success: '#6ed8b5',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      dropShadow: {
        glow: '0 0 20px rgba(176,128,255,0.25)',
        neon: '0 0 35px rgba(92,92,255,0.4)',
      },
      animation: {
        'pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slow-spin': 'slow-spin 18s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #9333ea, 0 0 10px #9333ea' },
          '100%': { boxShadow: '0 0 10px #9333ea, 0 0 20px #9333ea, 0 0 30px #9333ea' },
        },
        'slow-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #9333ea 0%, #8B5CF6 100%)',
        'gradient-purple-radial': 'radial-gradient(circle, #9333ea 0%, #7e22ce 100%)',
        'grid-lines': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'noise-texture': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http:%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'%2F%3E%3C%2Ffilter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'%2F%3E%3C%2Fsvg%3E\")",
      },
    },
  },
  plugins: [],
}