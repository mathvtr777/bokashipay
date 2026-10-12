import type { Config } from 'tailwindcss'

/**
 * Tema dark cyberpunk futurista — BokashiPay Quantum Gateway.
 *
 * Paleta cyberpunk com glassmorphism, neons roxos e gradientes vibrantes.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // === Fundos e superfícies (deep cyberpunk) ===
        deep: '#06050a',
        surface: {
          DEFAULT: 'rgba(18, 14, 28, 0.7)',
          card: 'rgba(23, 17, 38, 0.65)',
          elevated: 'rgba(34, 25, 58, 0.55)',
          border: 'rgba(147, 51, 234, 0.18)',
        },
        // === Identidade cyberpunk — gradientes neon ===
        cyber: {
          purple: '#9333ea',
          violet: '#a855f7',
          neon: '#c084fc',
          indigo: '#6366f1',
          accent: '#d946ef',
        },
        // === Fundo principal ===
        bg: {
          DEFAULT: '#06050a',
          sidebar: 'rgba(18, 14, 28, 0.72)',
          card: 'rgba(23, 17, 38, 0.65)',
          interactive: 'rgba(34, 25, 58, 0.55)',
          panel: '#130e24',
        },
        // === Brand principal (compatibilidade) ===
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7C3AED',
          600: '#9333FF',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4C1D95',
          950: '#2e1065',
        },
        // Status colors
        status: {
          success: '#20D6A0',
          pending: '#F5B942',
          error: '#F45B75',
          info: '#60A5FA',
        },
        // Ink colors
        ink: {
          50:  '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#A5B0CC',
          400: '#8592AB',
          500: '#707B99',
          600: '#505B78',
          700: '#424A60',
          800: '#2B3140',
          900: '#1c2028',
          950: '#0e1016',
        },
        // Line/border
        line: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Orbitron', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 15px rgba(168, 85, 247, 0.2)',
        'neon-md': '0 0 25px rgba(168, 85, 247, 0.35)',
        'neon-lg': '0 0 45px rgba(147, 51, 234, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': '0 1px 2px 0 rgb(7 8 18 / 0.04), 0 1px 3px 0 rgb(7 8 18 / 0.06)',
        'glow': '0 0 0 1px rgb(124 58 237 / 0.10), 0 8px 32px -8px rgb(124 58 237 / 0.22)',
        'glow-strong': '0 0 0 1px rgb(147 51 255 / 0.18), 0 12px 48px -8px rgb(124 58 237 / 0.45)',
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
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(122,58,255,0.45)' },
          '50%': { boxShadow: '0 0 0 14px rgba(122,58,255,0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'chart-draw': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-up': 'fade-up 0.6s ease-out both',
        marquee: 'marquee 30s linear infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-out infinite',
        'chart-draw': 'chart-draw 1.2s ease-out forwards',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
