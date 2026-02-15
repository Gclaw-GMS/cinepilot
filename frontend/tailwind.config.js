/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cinepilot: {
          dark: '#0a0a0a',
          card: '#111111',
          border: '#1a1a1a',
          accent: '#00d4ff',
          success: '#00e676',
          warning: '#ffd740',
          danger: '#ff5252',
        }
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
