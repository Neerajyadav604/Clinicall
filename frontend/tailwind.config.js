const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}"
  ],
  theme: {
    screens: {
      xs: "320px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "2560px",
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        stitch: {
          "surface-container-lowest": "#ffffff",
          "tertiary": "#004f5a",
          "background": "#f8f9fa",
          "primary-fixed": "#d6e3ff",
          "on-secondary": "#ffffff",
          "on-secondary-fixed-variant": "#304a55",
          "on-primary-fixed-variant": "#00468c",
          "secondary-container": "#cbe7f5",
          "tertiary-container": "#006976",
          "on-tertiary-fixed-variant": "#004e59",
          "primary": "#00478d",
          "on-primary": "#ffffff",
          "on-background": "#191c1d",
          "error-container": "#ffdad6",
          "surface-bright": "#f8f9fa",
          "on-primary-container": "#c8daff",
          "surface-container-high": "#e7e8e9",
          "surface-container-highest": "#e1e3e4",
          "outline-variant": "#c2c6d4",
          "inverse-surface": "#2e3132",
          "surface": "#f8f9fa",
          "surface-dim": "#d9dadb",
          "on-primary-fixed": "#001b3d",
          "surface-tint": "#005db6",
          "primary-container": "#005eb8",
          "inverse-on-surface": "#f0f1f2",
          "on-tertiary-container": "#74eaff",
          "tertiary-fixed-dim": "#55d7ed",
          "on-surface-variant": "#424752",
          "on-error-container": "#93000a",
          "on-surface": "#191c1d",
          "surface-container": "#edeeef",
          "surface-container-low": "#f3f4f5",
          "on-secondary-container": "#4e6874",
          "secondary-fixed": "#cbe7f5",
          "on-tertiary": "#ffffff",
          "primary-fixed-dim": "#a9c7ff",
          "tertiary-fixed": "#9eefff",
          "outline": "#727783",
          "on-secondary-fixed": "#021f29",
          "secondary-fixed-dim": "#afcbd8",
          "inverse-primary": "#a9c7ff",
          "error": "#ba1a1a",
          "secondary": "#48626e",
          "on-tertiary-fixed": "#001f24",
          "on-error": "#ffffff",
          "surface-variant": "#e1e3e4"
        }
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
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        aurora: "aurora 60s linear infinite",
      },
    }
  },
  plugins: [require("tailwindcss-animate"), addVariablesForColors],
};

// Adds each Tailwind color as a global CSS variable, e.g. var(--gray-200)
function addVariablesForColors({ addBase, theme }) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
  addBase({ ":root": newVars });
}
