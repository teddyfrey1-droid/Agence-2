import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/modules/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e8e0d3",
          300: "#d4c7b0",
          400: "#c2ab8a",
          500: "#b0926a",
          600: "#a3815a",
          700: "#886a4b",
          800: "#6f5741",
          900: "#5b4837",
          950: "#30251c",
        },
        champagne: {
          50: "#fdfbf7",
          100: "#f9f3e8",
          200: "#f2e5cd",
          300: "#e8d1a8",
          400: "#dcb87e",
          500: "#d3a45e",
          600: "#c58d47",
          700: "#a4723b",
          800: "#845b35",
          900: "#6c4b2e",
          950: "#3a2617",
        },
        stone: {
          50: "#f8f7f4",
          100: "#efede7",
          200: "#ddd9ce",
          300: "#c7c0ae",
          400: "#afa48d",
          500: "#9f9074",
          600: "#928068",
          700: "#7a6a57",
          800: "#64574a",
          900: "#52483d",
          950: "#2b2520",
        },
        anthracite: {
          50: "#f4f5f7",
          100: "#e3e5ea",
          200: "#cacdd7",
          300: "#a5aabb",
          400: "#7a8098",
          500: "#5f657d",
          600: "#4d516a",
          700: "#424558",
          800: "#393c4b",
          900: "#333541",
          950: "#1e1f27",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        premium: "0.625rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        premium:
          "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
