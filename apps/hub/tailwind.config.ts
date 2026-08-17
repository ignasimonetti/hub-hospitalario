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