/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07090d',
        surface: '#0f1117',
        surface2: '#161a22',
        surface3: '#1c2130',
        border: '#1e2535',
        gold: '#f5c842',
        gold2: '#e0a800',
        silver: '#c0c8d8',
        bronze: '#cd7f32',
        green2: '#2ecc71',
        red2: '#e74c3c',
        blue2: '#4a90e2',
        text: '#e4e9f4',
        muted: '#5a637a',
        muted2: '#8892a4',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
