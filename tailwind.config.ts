import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Roxo da marca. Tons progressivos para hierarquia sem poluir a interface.
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Neutros frios para o preto/cinza do fintech.
        ink: {
          50:  '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c9',
          400: '#8592ab',
          500: '#657292',
          600: '#505b78',
          700: '#424a60',
          800: '#2b3140',
          900: '#1c2028',
          950: '#0e1016',
        },
        // Borda padrão do tema. Aparece como `border-border` e em `*`.
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(14 16 22 / 0.04), 0 1px 3px 0 rgb(14 16 22 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(14 16 22 / 0.07), 0 10px 20px -4px rgb(14 16 22 / 0.10)',
        glow: '0 0 0 1px rgb(124 58 237 / 0.10), 0 8px 32px -8px rgb(124 58 237 / 0.22)',
        focus: '0 0 0 3px rgb(139 92 246 / 0.28)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'toast-shrink': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config