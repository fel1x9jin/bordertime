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
      boxShadow: {
        card: "0 14px 34px -22px rgba(11, 31, 54, 0.55)",
        lift: "0 24px 44px -24px rgba(11, 31, 54, 0.62)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
