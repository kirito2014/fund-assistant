import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#135bec",
        "background-light": "#f6f6f8",
        "background-dark": "#101622", // Main dark background
        "background-darker": "#0a0c10", // Deeper dark background (Screen 6)
        "glass-blue": "rgba(19, 91, 236, 0.15)",
        "gain-red": "#ff4d4f",
        "loss-green": "#52c41a",
      },
      fontFamily: {
        display: ["Manrope", "Noto Sans SC", "PingFang SC", "sans-serif"],
        body: ["Manrope", "Noto Sans SC", "PingFang SC", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
export default config;
