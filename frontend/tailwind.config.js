/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Okey-Spiel Farben
        'tile-red': '#E63946',
        'tile-black': '#1D3557',
        'tile-blue': '#457B9D',
        'tile-yellow': '#F1C40F',
        'board-green': '#2D6A4F',
        'board-dark': '#1B4332',
      },
      fontFamily: {
        'game': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'tile': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'tile-hover': '0 4px 12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
