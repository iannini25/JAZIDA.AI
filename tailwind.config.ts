import type { Config } from "tailwindcss";

// Sistema visual Strata — paleta mineral.
// SOLO = superficie clara (cidadao / mobile / papel cremoso).
// SUBSOLO = superficie escura (operador / desktop / tinta).
// Brand: jazida-verde mineral (#2C5F4A) — NAO emerald-700.
// Minerais: ferro / ocre / cobre / grafite — todos com versao -tenue.
// Sinais: critico / alerta / atencao / estavel / info.

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solo: {
          papel: "#F4EFE6",
          "papel-fundo": "#EAE3D6",
          "papel-claro": "#FBF8F2",
          tinta: "#1A1816",
          "tinta-suave": "#4A4541",
          "tinta-tenue": "#8A8278",
          linha: "#D9D2C2",
          "linha-forte": "#B8AE9A",
        },
        subsolo: {
          tinta: "#15140F",
          "tinta-2": "#1E1D17",
          "tinta-3": "#25241D",
          "tinta-4": "#2E2C24",
          osso: "#E9E5DD",
          "osso-suave": "#A8A296",
          "osso-tenue": "#6E695E",
          linha: "#2E2C24",
          "linha-forte": "#3E3B33",
        },
        jazida: {
          DEFAULT: "#2C5F4A",
          verde: "#2C5F4A",
          "verde-vivo": "#3F8060",
        },
        ferro: {
          DEFAULT: "#B45A2C",
        },
        ocre: {
          DEFAULT: "#C9A961",
        },
        cobre: {
          DEFAULT: "#8C5A3C",
        },
        grafite: {
          DEFAULT: "#4A4845",
        },
        sinal: {
          critico: "#A83A28",
          alerta: "#C9853A",
          atencao: "#C9A961",
          estavel: "#2C5F4A",
          info: "#3D6F8F",
        },

        // Aliases legacy pra evitar quebra durante migracao.
        // Eventualmente todas referencias vao para os tokens Strata acima.
        brand: {
          DEFAULT: "#2C5F4A",
          green: "#2C5F4A",
          "green-light": "#3F8060",
          bg: "#EAE3D6",
        },
        text: {
          primary: "#1A1816",
          secondary: "#4A4541",
        },
        accent: {
          gold: "#C9A961",
          red: "#A83A28",
          amber: "#C9853A",
        },
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
        body: ['"Inter Tight"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        regulatory: "4px",
      },
      letterSpacing: {
        microlabel: "0.18em",
      },
      transitionTimingFunction: {
        strata: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      boxShadow: {
        papel: "0 1px 0 rgba(26,24,22,0.04)",
        modal: "0 24px 48px -12px rgba(26,24,22,0.45)",
        foco: "0 0 0 3px rgba(63, 128, 96, 0.12)",
      },
      animation: {
        "shimmer-up": "shimmer-up 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        "fill-up": "fill-up 600ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
      keyframes: {
        "shimmer-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "35%": { opacity: "0.9" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.92)" },
        },
        "fill-up": {
          from: { transform: "scaleY(0)", opacity: "0" },
          to: { transform: "scaleY(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
