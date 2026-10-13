import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1F36",
        board: "#0B2545",
        sign: "#FFC72C",
        mist: "#EEF1F5",
        line: "#D5DBE3",
        ok: "#17714A",
        warn: "#8A5A00",
        bad: "#B02A1E",
      },
      fontFamily: {
        body: [
          "var(--font-body)",
          "system-ui",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "system-ui",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
