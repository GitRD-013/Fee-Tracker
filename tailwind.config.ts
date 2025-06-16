
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Montserrat', 'sans-serif'], // Changed from Space Grotesk
        code: ['Source Code Pro', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          // Glassmorphic card backgrounds
          'glass-purple': 'hsla(var(--card-glass-purple-background))',
          'glass-purple-foreground': 'hsl(var(--card-glass-purple-foreground))',
          'glass-purple-border': 'hsl(var(--card-glass-purple-border))',
          'glass-blue': 'hsla(var(--card-glass-blue-background))',
          'glass-blue-foreground': 'hsl(var(--card-glass-blue-foreground))',
          'glass-blue-border': 'hsl(var(--card-glass-blue-border))',
          'glass-green': 'hsla(var(--card-glass-green-background))',
          'glass-green-foreground': 'hsl(var(--card-glass-green-foreground))',
          'glass-green-border': 'hsl(var(--card-glass-green-border))',
          'glass-red': 'hsla(var(--card-glass-red-background))',
          'glass-red-foreground': 'hsl(var(--card-glass-red-foreground))',
          'glass-red-border': 'hsl(var(--card-glass-red-border))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: { 
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: { 
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: { 
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        badge: { 
          'status-success-background': 'hsl(var(--badge-status-success-background))',
          'status-success-foreground': 'hsl(var(--badge-status-success-foreground))',
          'status-warning-background': 'hsl(var(--badge-status-warning-background))',
          'status-warning-foreground': 'hsl(var(--badge-status-warning-foreground))',
          'status-destructive-background': 'hsl(var(--badge-status-destructive-background))',
          'status-destructive-foreground': 'hsl(var(--badge-status-destructive-foreground))',
        },
        table: {
          header: {
            DEFAULT: 'hsl(var(--table-header-background))',
            foreground: 'hsl(var(--table-header-foreground))',
          },
          row: {
            DEFAULT: 'hsl(var(--table-row-background))',
            hover: 'hsl(var(--table-row-hover-background))',
          },
          border: 'hsl(var(--table-border))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
