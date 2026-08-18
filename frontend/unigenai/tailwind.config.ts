import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-marcellus)", "Georgia", "serif"],
        sans: ["var(--font-josefin)", "sans-serif"],
        body: ["var(--font-josefin)", "sans-serif"],
      },
      colors: {
        obsidian: "#0A0A0A",
        champagne: "#F2F0E4",
        charcoal: "#141414",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F2E8C4",
          dark: "#AA8828",
          glow: "rgba(212, 175, 55, 0.25)",
        },
        midnight: "#1E3D59",
        pewter: "#888888",
      },
      boxShadow: {
        gold: "0 0 15px rgba(212, 175, 55, 0.25)",
        "gold-lg": "0 0 25px rgba(212, 175, 55, 0.45)",
        "gold-glow": "0 0 35px rgba(212, 175, 55, 0.3)",
      },
      letterSpacing: {
        artdeco: "0.25em",
        grand: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;
