/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        feud: {
          board: '#0b2a6b',
          panel: '#1742a8',
          accent: '#ffd23f',
          xred: '#e63946',
          good: '#3ad36b',
        },
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
