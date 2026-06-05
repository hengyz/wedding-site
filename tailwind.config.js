/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EF',
          200: '#F5EDE0',
        },
        champagne: {
          400: '#D4B896',
          500: '#C4A574',
          600: '#A8895C',
        },
        blush: {
          100: '#FCE8EC',
          200: '#F8D4DC',
          300: '#F0B8C4',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
