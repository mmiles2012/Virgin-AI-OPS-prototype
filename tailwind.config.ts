import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Virgin Atlantic Brand Colors
        'va-red': {
          primary: 'hsl(var(--va-red-primary))',
          heritage: 'hsl(var(--va-red-heritage))',
          rebel: 'hsl(var(--va-red-rebel))',
        },
        'va-space': 'hsl(var(--va-deep-space))',
        'va-grey': 'hsl(var(--va-cosmic-grey))',
        'va-white': 'hsl(var(--va-cloud-white))',
        'va-blue': 'hsl(var(--va-sky-blue))',
        'va-midnight': 'hsl(var(--va-midnight))',
        
        // Aviation Operations Colors
        'aero-blue': {
          primary: 'hsl(var(--aero-blue-primary))',
          light: 'hsl(var(--aero-blue-light))',
          dark: 'hsl(var(--aero-blue-dark))',
        },
        'aero-green': {
          safe: 'hsl(var(--aero-green-safe))',
          light: 'hsl(var(--aero-green-light))',
        },
        'aero-amber': {
          caution: 'hsl(var(--aero-amber-caution))',
          light: 'hsl(var(--aero-amber-light))',
        },
        'aero-orange': {
          alert: 'hsl(var(--aero-orange-alert))',
        },
        'aero-purple': {
          premium: 'hsl(var(--aero-purple-premium))',
        },
        
        // Surface Colors
        'surface': {
          primary: 'hsl(var(--surface-primary))',
          secondary: 'hsl(var(--surface-secondary))',
          tertiary: 'hsl(var(--surface-tertiary))',
        },
        
        // Base Design System Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
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
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      fontSize: {
        'va-xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'va-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'va-base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'va-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'va-xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'va-2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'va-3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'va-4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-emergency": "pulse-emergency 2s infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-emergency": {
          "0%, 100%": { 
            opacity: "1", 
            boxShadow: "0 0 20px hsl(var(--va-red-primary) / 0.5)"
          },
          "50%": { 
            opacity: "0.8", 
            boxShadow: "0 0 30px hsl(var(--va-red-primary) / 0.8)"
          },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      boxShadow: {
        'va-sm': '0 1px 2px 0 hsl(var(--va-deep-space) / 0.05)',
        'va-md': '0 4px 6px -1px hsl(var(--va-deep-space) / 0.1), 0 2px 4px -1px hsl(var(--va-deep-space) / 0.06)',
        'va-lg': '0 10px 15px -3px hsl(var(--va-deep-space) / 0.1), 0 4px 6px -2px hsl(var(--va-deep-space) / 0.05)',
        'va-xl': '0 20px 25px -5px hsl(var(--va-deep-space) / 0.1), 0 10px 10px -5px hsl(var(--va-deep-space) / 0.04)',
        'va-glow': '0 0 20px hsl(var(--va-red-primary) / 0.3)',
        'aero-glow': '0 0 20px hsl(var(--aero-blue-primary) / 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
