import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: "#0a0a0f",
        paper: "#f5f0e8",
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
