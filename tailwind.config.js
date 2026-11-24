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
        brand: {
          DEFAULT: '#1e3a8a',
          hover: '#172e6e',
          soft: '#eff4ff',
          dark: '#3b82f6',
          'dark-hover': '#2563eb',
          gold: '#eab308',
        },
        canvas: {
          light: '#f8fafc',
          dark: '#090d16',
        },
        surface: {
          light: '#ffffff',
          dark: '#111827',
          subtle: '#f1f5f9',
          'subtle-dark': '#172033',
        },
        line: {
          light: '#e2e8f0',
          dark: '#1f2a40',
        },
      },
      boxShadow: {
        soft: '0 8px 28px -8px rgba(15, 23, 42, 0.08)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px -4px rgba(15, 23, 42, 0.04)',
        popover: '0 12px 32px -6px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
