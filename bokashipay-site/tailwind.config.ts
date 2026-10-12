import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta BokashiPay: roxa, preta e branca
        bp: {
          // Roxos
          50:  "#f5f1ff",
          100: "#ede4ff",
          200: "#d6c2ff",
          300: "#b693ff",
          400: "#9663ff",
          500: "#7a3aff",  // roxo principal
          600: "#6422e6",
          700: "#4f17b3",
          800: "#3a0f80",
          900: "#260a4d",
          // Pretos
          ink: "#0a0612",
          panel: "#110a1f",
          line: "#1f1432",
          // Brancos
          mist: "#f4f1ff",
          snow: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(122,58,255,0.45)" },
          "50%":      { boxShadow: "0 0 0 14px rgba(122,58,255,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        marquee: "marquee 30s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
