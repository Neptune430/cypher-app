/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: "#B5E853",
        "brand-dark": "#8fc93a",
        navy: "#0d1117",
        "navy-2": "#161b22",
        "navy-3": "#1c2333",
        "navy-4": "#21262d",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
