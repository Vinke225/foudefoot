/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#7CFF3B",
        secondary: "#1E8F45",
        background: "#F7F7F7",
        backgroundDark: "#0B0F14",
        textMain: "#111111",
        textSecondary: "#777777",
        liveRed: "#FF3B30",
        cardWhite: "#FFFFFF",
      }
    },
  },
  plugins: [],
}
