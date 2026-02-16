/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb', // Custom border color
        background: '#ffffff', // Custom background color
        foreground: '#22292f', // Custom foreground color
      },
    },
  },
  plugins: [],
};
