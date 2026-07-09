/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Mapeia todas as telas e componentes Angular
  ],
  theme: {
    extend: {
      colors: {
        // Cores padrão do protótipo Figma que geramos
        'ekd-dark-blue': '#0a2540',
        'ekd-light-blue': '#f4f8fa',
      }
    },
  },
  plugins: [],
}
