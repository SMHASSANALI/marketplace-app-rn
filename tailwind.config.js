/**
 * Tailwind CSS configuration for NativeWind v4.
 *
 * content  — tells Tailwind which files to scan for class names (no dead CSS).
 * presets  — NativeWind preset maps Tailwind utilities to React Native styles.
 * theme    — brand colours and custom design tokens for the marketplace.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // prevents NativeWind web from auto-detecting media dark mode
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand palette — matches theme.ts constants
        brand:   '#b5532e', // primary rust/terracotta
        'brand-light': '#f0ddd5',
        teal:    '#0f766e',
        bg:      '#faf7f2', // warm off-white background
        surface: '#ffffff',
        text:    '#1c1917', // near-black
        muted:   '#78716c', // stone-500
        border:  '#e7e5e4', // stone-200
        success: '#16a34a',
        warning: '#ca8a04',
        danger:  '#dc2626',
        info:    '#0369a1',
      },
    },
  },
  plugins: [],
};
