/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'pan-black': '#000000',
        'pan-white': '#ffffff',
        'pan-gray': '#6b7280',
        'pan-gray-light': '#9ca3af',
        'pan-gray-dark': '#374151',
      },
    },
  },
  plugins: [],
}
