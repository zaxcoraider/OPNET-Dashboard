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
        background: "#0d0d0d",
        foreground: "#ffffff",
        "op-orange": "#f7931a",
        "op-purple": "#7b3fe4",
        "card": "#161616",
        "sidebar": "#111111",
        "border-dark": "#222222",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        "orange-glow": "0 0 20px rgba(247, 147, 26, 0.2)",
        "purple-glow": "0 0 20px rgba(123, 63, 228, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
