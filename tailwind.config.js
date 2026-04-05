/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krill: {
          bg: '#06080f',
          surface: '#0f0c28',
          card: '#1e1b3a',
          border: '#312e5a',
          indigo: '#6366f1',
          purple: '#7c3aed',
          violet: '#a78bfa',
          lavender: '#c4b5fd',
          cyan: '#22d3ee',
          green: '#4ade80',
          red: '#f87171',
          amber: '#fbbf24',
          slate: '#94a3b8',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'signal-wave': 'signal-wave 2s ease-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'data-flow': 'data-flow 2s linear infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
        'flatline': 'flatline 0.5s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out infinite',
        'overheat': 'overheat 2s ease-in-out infinite',
        'cascade-out': 'cascade-out 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-3px, 3px)' },
          '40%': { transform: 'translate(-3px, -3px)' },
          '60%': { transform: 'translate(3px, 3px)' },
          '80%': { transform: 'translate(3px, -3px)' },
          '100%': { transform: 'translate(0)' },
        },
        'signal-wave': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'data-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.1)' },
        },
        flatline: {
          '0%': { transform: 'scaleY(1)', opacity: '1' },
          '100%': { transform: 'scaleY(0.02)', opacity: '0.4' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        overheat: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.5) saturate(1.5)' },
        },
        'cascade-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}
