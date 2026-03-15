/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta FitPro
        background: '#0f0f14',
        surface: '#1a1a24',
        surfaceLight: '#252532',
        border: '#2e2e40',
        primary: '#6C63FF',
        primaryDark: '#4f48cc',
        accent: '#FF6584',
        success: '#4ade80',
        warning: '#facc15',
        error: '#f87171',
        textPrimary: '#f4f4f8',
        textSecondary: '#9090a8',
        textMuted: '#5a5a70',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
