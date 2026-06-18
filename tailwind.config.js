/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          black: '#0f1a2b',
          dark: '#152238',
          slate: '#1f3049',
          neonBlue: '#3b82f6',
          neonTeal: '#06b6d4',
          neonGreen: '#10b981',
        },
      },
    },
  },
  plugins: [],
};
