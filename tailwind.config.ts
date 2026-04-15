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
        // Legacy admin/landing tokens (kept so the rest of the app still renders)
        paper: "#F6F1EB",
        ink: "#1A1A1A",
        muted: "#8A8070",
        "border-dark": "#D6CCBC",
        "border-light": "#E8E0D4",
        // handled. brand tokens — Pipeline/Pulse product (docs/PRODUCT_SPEC.md)
        navy: "#1E2A3A",
        amber: "#E8922A",
        "warm-bg": "#F7F7F5",
        "card-border": "#E8E8E4",
        "hint-bg": "#FFF8EF",
        recovery: "#DC2626",
        "recovery-bg": "#FEF2F2",
        success: "#16A34A",
        info: "#2563EB",
        purple: "#7C3AED",
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
        // handled. product UI — DM Sans for body, IBM Plex Mono for numbers/badges
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        body: ["'DM Sans'", "'Libre Franklin'", "sans-serif"],
        serif: ["'Newsreader'", "serif"],
        sans: ["'DM Sans'", "'Libre Franklin'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
