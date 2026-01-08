import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom gaming colors
        neon: {
          cyan: "hsl(var(--neon-cyan))",
          pink: "hsl(var(--neon-pink))",
          purple: "hsl(var(--neon-purple))",
        },
        star: {
          gold: "hsl(var(--star-gold))",
        },
        night: {
          deep: "hsl(var(--night-deep))",
          mid: "hsl(var(--night-mid))",
        },
      },
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
        retro: ["'VT323'", "monospace"],
        cartoon: ["'Fredoka'", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pixel-pulse": {
          "0%, 100%": { boxShadow: "4px 4px 0px hsl(252 40% 5%), 0 0 0 0 hsl(180 100% 50% / 0.4)" },
          "50%": { boxShadow: "4px 4px 0px hsl(252 40% 5%), 0 0 20px 5px hsl(180 100% 50% / 0.2)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        sparkle: "sparkle 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "pixel-pulse": "pixel-pulse 2s ease-in-out infinite",
        wiggle: "wiggle 0.3s ease-in-out",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
      },
      boxShadow: {
        pixel: "4px 4px 0px hsl(252 40% 5%)",
        "pixel-lg": "6px 6px 0px hsl(252 40% 5%)",
        neon: "0 0 10px hsl(180 100% 50% / 0.5), 0 0 20px hsl(180 100% 50% / 0.3)",
        "neon-pink": "0 0 10px hsl(320 100% 60% / 0.5), 0 0 20px hsl(320 100% 60% / 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
