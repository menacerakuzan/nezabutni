import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Серйозна палітра: чорний + темно-синій + темно-бордовий ──
        void: "#09090C", // майже чорний ґрунт
        black: "#050507",
        "navy-950": "#0B1C31", // глибокий темно-синій (піднята зала)
        "navy-900": "#002F5E", // брендовий синій — акцентна зала
        "navy-800": "#0C3161",
        panel: "#0D2138", // синя панель
        // темно-бордовий (наш кармін, приглушений до бордо)
        bordeaux: "#26101A",
        "bordeaux-2": "#3A1524",
        crimson: "#9F1F47", // брендовий бордо-акцент
        "crimson-bright": "#C7405F",
        // світло / папір / свічка
        cream: "#FFF2E8",
        "cream-dim": "#E7DACB",
        gold: "#DF9B3B",
        "gold-soft": "#EAB868",
        "gold-deep": "#B97A28",
        good: "#5FA36E",
        warn: "#D8A24A",
        "ink-hi": "#FBF3E9",
      },
      fontFamily: {
        display: ["var(--font-odesa)", "sans-serif"],
        sans: ["var(--font-odesa)", "sans-serif"],
      },
      borderRadius: {
        tile: "4px",
      },
      maxWidth: {
        prose: "60ch",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-slow": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
