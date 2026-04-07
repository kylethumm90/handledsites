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
        paper: "#F6F1EB",
        ink: "#1A1A1A",
        muted: "#8A8070",
        "border-dark": "#D6CCBC",
        "border-light": "#E8E0D4",
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
        display: ["'Newsreader'", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Libre Franklin'", "sans-serif"],
        serif: ["'Newsreader'", "serif"],
        sans: ["'Libre Franklin'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
