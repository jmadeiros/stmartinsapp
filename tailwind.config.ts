import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
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
  			card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
  			},
  			popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
  			},
  			primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
  			},
  			secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
  			},
  			muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
  			},
  			accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
  			},
  			destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
  			},
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
  			chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        surface: "var(--surface)",
        "surface-secondary": "color-mix(in oklab, var(--surface) 94%, var(--surface-foreground) 6%)",
        "surface-tertiary": "color-mix(in oklab, var(--surface) 92%, var(--surface-foreground) 8%)",
        overlay: "var(--overlay)",
        "overlay-foreground": "var(--overlay-foreground)",
  		},
  		borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.08)",
        surface: "var(--shadow-surface)",
        overlay: "var(--shadow-overlay)",
        card: "var(--shadow-card)",
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
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
  		},
  		animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        gradient: "gradient 6s ease infinite",
        shine: "shine 1.5s ease-in-out infinite",
        ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
