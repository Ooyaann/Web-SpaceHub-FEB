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
          'navy-hover': '#0A1E46',
          gold: '#F5B800',
          'gold-hover': '#E0A800',
          'gold-ink': '#111317',
        },
        // Crisp Neutral Graphite Dark Hierarchy (Linear / Cal.com inspired — zero muddy blue/green cast)
        ink: {
          rail: '#111317',
          canvas: '#16181E',
          card: '#1F232C',
          subtle: '#282D39',
          hover: '#313746',
          line: '#2E3443',
          'line-strong': '#3E465A',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.03)',
        'card-hover': '0 12px 28px -8px rgba(15, 42, 94, 0.12), 0 4px 10px -4px rgba(16, 24, 40, 0.06)',
        popover: '0 14px 34px -8px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
        'popover-dark': '0 18px 42px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
};
