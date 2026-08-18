/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0A',
        champagne: '#F2F0E4',
        charcoal: '#141414',
        gold: '#D4AF37',
        'gold-light': '#F2E8C4',
        midnight: '#1E3D59',
        pewter: '#888888',
      },
      fontFamily: {
        display: ['Marcellus', 'Italiana', 'Georgia', 'serif'],
        sans: ['Josefin Sans', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 15px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 0 25px rgba(212, 175, 55, 0.45)',
        'gold-inner': 'inset 0 0 15px rgba(212, 175, 55, 0.15)',
      },
      letterSpacing: {
        widest: '0.25em',
        extreme: '0.35em',
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        full: '0px',
      },
    },
  },
  plugins: [],
};
