/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "ant-teal":    "#33e2c3",
        "ant-forest":  "#004a38",
        "ant-mint":    "#b2ffe3",
        "ant-ink":     "#050d0a",
        "ant-surface": "#fefcf8",
      },
      fontFamily: {
        sans: ["'Saans Variable'", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
}

