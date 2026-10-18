import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      ink: "rgb(var(--ink-rgb) / <alpha-value>)", surface: "rgb(var(--surface-rgb) / <alpha-value>)", surface2: "rgb(var(--surface-2-rgb) / <alpha-value>)", border: "rgb(var(--border-rgb) / <alpha-value>)",
      paper: "rgb(var(--paper-rgb) / <alpha-value>)", muted: "rgb(var(--muted-rgb) / <alpha-value>)", amber: "rgb(var(--amber-rgb) / <alpha-value>)", teal: "rgb(var(--teal-rgb) / <alpha-value>)", error: "rgb(var(--error-rgb) / <alpha-value>)",
    },
    fontFamily: {
      serif: ["var(--font-newsreader)", "Georgia", "serif"],
      sans: ["var(--font-plex)", "system-ui", "sans-serif"],
      mono: ["var(--font-plex-mono)", "monospace"],
    },
  } },
  plugins: [],
};
export default config;
