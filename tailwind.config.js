/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        unnes: {
          navy: '#0B2459',
          royal: '#0B2A6F',
          'royal-hover': '#081E52',
          gold: '#FFC72C',
          'gold-hover': '#F0B400',
          'gold-ink': '#0B1221',
          // Dark mode: composed UNNES midnight navy ramp
          'night-rail': '#070D1A',
          'night-bg': '#0B1221',
          'night-card': '#111B30',
          'night-input': '#0E172A',
          'night-line': '#1E2C4A',
          'night-muted': '#94A6C8',
        },
        canvas: {
          light: '#F6F7F9',
          dark: '#0B1221',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#111B30',
          subtle: '#EFF2F7',
          'subtle-dark': '#0E172A',
        },
        line: {
          light: '#DFE4EE',
          dark: '#1E2C4A',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(11, 36, 89, 0.05)',
        popover: '0 14px 36px -8px rgba(7, 13, 26, 0.28), 0 2px 6px rgba(7, 13, 26, 0.08)',
      },
    },
  },
  plugins: [],
};
