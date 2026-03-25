/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#D4873A',
        navy: '#052254',
        gold: '#E8A84C',
        cream: '#F5EFE6',
        brown: '#614141',
        success: '#4CAF87',
        error: '#C0392B',
        pending: '#F39C12',
        'card-bg': '#FFFFFF',
        'scaffold-bg': '#FAF6F0',
        'text-primary': '#1C1C1E',
        'text-muted': '#8B7D6B',
      },
      fontFamily: {
        display: ['DMSerifDisplay_400Regular'],
        sans: ['WorkSans_400Regular'],
        'sans-medium': ['WorkSans_500Medium'],
        'sans-semibold': ['WorkSans_600SemiBold'],
      },
    },
  },
  plugins: [],
};
