/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
      },
      colors: {
        background: '#0f172a',
        foreground: '#f1f5f9',
        muted: {
          DEFAULT: '#334155',
          foreground: '#94a3b8',
        },
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#64748b',
          foreground: '#ffffff',
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': {
            backgroundPosition: '-468px 0',
          },
          '100%': {
            backgroundPosition: '468px 0',
          },
        },
      },
    },
  },
  plugins: [],
};
