import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          surface: "rgba(18, 24, 38, 0.65)",
          border: "rgba(255, 255, 255, 0.12)",
          hover: "rgba(30, 41, 64, 0.75)",
          active: "rgba(45, 60, 95, 0.85)",
          glow: "rgba(56, 189, 248, 0.15)",
        },
        brand: {
          cyan: "#00F0FF",
          emerald: "#10B981",
          violet: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
          blue: "#3B82F6",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        'liquid-pulse': 'liquidPulse 8s ease-in-out infinite',
        'glass-shimmer': 'glassShimmer 3s ease-in-out infinite',
        'orb-float': 'orbFloat 14s ease-in-out infinite alternate',
      },
      keyframes: {
        liquidPulse: {
          '0%, 100%': { transform: 'scale(1) translate(0px, 0px)', opacity: '0.45' },
          '50%': { transform: 'scale(1.12) translate(15px, -15px)', opacity: '0.7' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        orbFloat: {
          '0%': { transform: 'translate(0px, 0px) rotate(0deg)' },
          '50%': { transform: 'translate(40px, -30px) rotate(180deg)' },
          '100%': { transform: 'translate(-30px, 20px) rotate(360deg)' },
        }
      },
      borderRadius: {
        'square-none': '0px',
        'square-xs': '2px',
        'square-sm': '4px',
        'square-md': '6px',
        'square-lg': '8px',
      }
    },
  },
  plugins: [],
};
export default config;
