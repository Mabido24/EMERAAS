/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./about.html",
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emeraas: {
          light: '#f8fafc',
          dark: '#0f172a',
          orange: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}
