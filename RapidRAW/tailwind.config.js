/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'rgba(var(--color-bg-primary-rgb), var(--opacity-bg-primary, 1))',
        'bg-secondary': 'rgba(var(--color-bg-secondary-rgb), var(--opacity-bg-secondary, 1))',
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'card-active': 'rgb(var(--color-card-active) / <alpha-value>)',
        'button-text': 'rgb(var(--color-button-text) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'border-color': 'rgb(var(--color-border-color) / <alpha-value>)',
        'hover-color': 'rgb(var(--color-hover-color) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'shiny': '0 0 24px rgba(255, 255, 255, 0.12)',
      },
      borderRadius: {
        'md': '8px',
        'lg': '15px',
      }
    },
  },
  plugins: [],
}