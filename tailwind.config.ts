import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          bg: "#12151f",
          surface: "#1a1e2e",
          muted: "#9aa0b8",
          call: "#e03535",
          "text-bg": "#1a4d2e",
          "text-fg": "#4ade80",
          "save-bg": "#1a2a4a",
          "save-fg": "#5b8ef0",
        },
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
