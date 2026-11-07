/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        heart: {
          '0%': { transform: 'scale(0) rotate(-12deg)', opacity: '0' },
          '15%': { transform: 'scale(1.25) rotate(0deg)', opacity: '1' },
          '30%': { transform: 'scale(0.95)' },
          '60%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.1)', opacity: '0' },
        },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        heart: 'heart .9s ease-out forwards',
        'sheet-up': 'sheet-up .32s cubic-bezier(.32,.72,0,1)',
        'fade-in': 'fade-in .2s ease-out',
        rise: 'rise .4s ease-out both',
      },
    },
  },
  plugins: [],
};