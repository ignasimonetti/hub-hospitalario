import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // AGREGADO: Escanear archivos de novel para estilos de Tailwind
    "./node_modules/novel/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cisb: {
          blue: "#08487A",
          dark: "#053D6C",
          light: "#33638B",
          red: "#C01429",
        },
        notion: {
          primary: "#0075de",
          "primary-active": "#005bab",
          secondary: "#213183",
          canvas: "#ffffff",
          "canvas-soft": "#f6f5f4",
          surface: "#ffffff",
          ink: "#000000",
          "ink-secondary": "#31302e",
          "ink-muted": "#615d59",
          "ink-faint": "#a39e98",
          hairline: "#e6e6e6",
          "hairline-dark": "#2e2e2e",
          // Sticker Palette (decoración)
          sky: "#62aef0",
          purple: "#d6b6f6",
          "purple-deep": "#391c57",
          pink: "#ff64c8",
          orange: "#dd5b00",
          teal: "#2a9d99",
          green: "#1aae39",
          brown: "#523410",
        },
      },
      borderRadius: {
        "notion-xs": "4px",
        "notion-sm": "5px",
        "notion-md": "8px",
        "notion-lg": "12px",
        "notion-xl": "16px",
      },
      letterSpacing: {
        "notion-tight": "-0.025em",
        "notion-display": "-0.04em",
      },
      boxShadow: {
        "notion-soft": "0 0.175px 1.041px rgba(0,0,0,0.01), 0 0.8px 2.925px rgba(0,0,0,0.02), 0 2.025px 7.847px rgba(0,0,0,0.027)",
        "notion-elevated": "0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04), 0 23px 52px rgba(0,0,0,0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    // AGREGADO: Plugin para la tipografía de novel
    require("@tailwindcss/typography"),
  ],
};
export default config;