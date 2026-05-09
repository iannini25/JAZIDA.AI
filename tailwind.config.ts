import type { Config } from "tailwindcss";

// Tokens do master (00_contexto_master.md):
//   --brand-green: #047857    --brand-green-light: #10B981
//   --brand-bg: #F9FAFB        --text-primary: #111827
//   --text-secondary: #6B7280  --accent-gold: #D4A017
//   --accent-red: #DC2626      --accent-amber: #F59E0B
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#047857",
          green: "#047857",
          "green-light": "#10B981",
          bg: "#F9FAFB",
        },
        accent: {
          gold: "#D4A017",
          red: "#DC2626",
          amber: "#F59E0B",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
