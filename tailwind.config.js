/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#F34E3A',
        navy: '#052254',
        gold: '#F7B656',
        cream: '#FBF4C2',
        brown: '#614141',
        success: '#4CAF87',
        error: '#C0392B',
        pending: '#F39C12',
        'card-bg': '#FFFFFF',
        'scaffold-bg': '#F5F5F5',
        'text-primary': '#1A1A2E',
        'text-muted': '#6B7280',
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
