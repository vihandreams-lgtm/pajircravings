/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          burgundy: {
            DEFAULT: '#78222E', // Vibrant, rich Lovable maroon
            dark: '#4F121B',    // Deep velvet maroon for titles
            light: '#963442',
          },
          cream: {
            DEFAULT: '#F3E1DA', // Rich, warm pinkish-cream tint matching Lovable
            dark: '#E8D0C8',
          },
          charcoal: {
            DEFAULT: '#222222',
            muted: '#555555',
          }
        },
        fontFamily: {
          serif: ['Fraunces', 'serif'],
          sans: ['Outfit', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }