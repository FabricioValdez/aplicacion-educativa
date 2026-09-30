/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0284C7",
        secondary: "#FBBF24",
        tertiary: "#34D399",
        neutral: "#475569",
        surface: "#FDFBF7",
        "surface-soft": "#F8FAFC",
        white: "#FFFFFF",
        border: "#E2E8F0",
      },
      fontFamily: {
        heading: ["Quicksand", "sans-serif"],
        body: ["Nunito Sans", "sans-serif"],
      },
      boxShadow: {
        soft:
          "0 8px 0 rgba(148, 163, 184, 0.18), 0 12px 24px rgba(15, 23, 42, 0.05)",
        card:
          "0 8px 0 #E2E8F0, 0 12px 24px rgba(15, 23, 42, 0.05)",
        button: "0 5px 0 #0369A1",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};