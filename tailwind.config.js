/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        unnes: {
          navy: '#0b2a6f',
          'navy-deep': '#07163f',
          blue: '#1d4ed8',
          'blue-light': '#5b8cff',
          gold: '#ffc72c',
          'gold-ink': '#1a1500',
          surface: '#f1f5fd',
          'surface-dark': '#0a1226',
          'card-dark': '#121c38',
          border: '#dbe3f3',
          'border-dark': '#25335a',
        },
        slot: {
          free: '#22c55e',
          'free-soft': '#a7e3bd',
          'free-dark': '#1f6a43',
          class: '#1d4ed8',
          'class-dark': '#5b8cff',
          other: '#f08a24',
          'other-dark': '#ff9f45',
          mine: '#ffc72c',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(11, 42, 111, 0.08)',
        card: '0 1px 3px rgba(15, 29, 61, 0.05), 0 6px 16px -6px rgba(15, 29, 61, 0.06)',
      },
    },
  },
  plugins: [],
};
