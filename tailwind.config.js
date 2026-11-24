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
          navy: '#0F2A5E',
          'navy-hover': '#0B204A',
          gold: '#F4B918',
          'gold-hover': '#E0A80D',
          'gold-ink': '#111622',
        },
        // Elevated, comfortable dark mode (NOT pitch black)
        ink: {
          canvas: '#161B26',
          rail: '#111622',
          card: '#1E2534',
          subtle: '#252E40',
          hover: '#2B354A',
        },
      },
      boxShadow: {
        popover: '0 12px 32px -8px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
        'popover-dark': '0 16px 40px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
};
