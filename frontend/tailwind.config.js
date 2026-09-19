/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eff8f4',
          100: '#d7e7dc',
          200: '#b8d4c4',
          300: '#77bca2',
          400: '#36a57b',
          500: '#1e5e51',
          600: '#1a5d51',
          700: '#174a3f',
          800: '#173a34',
          900: '#0f2622',
        },
        sage: {
          50: '#f7faf7',
          100: '#edf5f0',
          200: '#e4eee7',
          300: '#cfe0d6',
          400: '#98a7a1',
          500: '#78918a',
          600: '#536864',
          700: '#36544c',
          800: '#203331',
          900: '#152220',
        },
        coral: {
          50: '#fcf5ed',
          100: '#f9e2d2',
          200: '#f6ddca',
          300: '#df9274',
          400: '#c77b63',
          500: '#b85e4b',
          600: '#9a5c47',
        },
        surface: {
          base: '#f6f8f5',
          card: '#fcfdfb',
          accent: '#edf5f0',
          dark: '#234b43',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
