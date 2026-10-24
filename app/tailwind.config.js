/** @type {import('tailwindcss').Config} */
const gray = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(step => [
    step,
    `rgb(var(--gray-${step}) / <alpha-value>)`,
  ]),
);

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray,
      },
    },
  },
  plugins: [],
};
