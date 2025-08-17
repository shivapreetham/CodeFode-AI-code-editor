import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Yellow/Brown/Amber color scheme with proper contrast
        primary: {
          50: '#fffbeb',   // Very light cream
          100: '#fef3c7',  // Light cream
          200: '#fde68a',  // Light yellow
          300: '#fcd34d',  // Medium yellow
          400: '#fbbf24',  // Bright yellow
          500: '#f59e0b',  // Orange-yellow (main primary)
          600: '#d97706',  // Dark orange
          700: '#b45309',  // Brown-orange
          800: '#92400e',  // Dark brown
          900: '#78350f',  // Very dark brown
          950: '#451a03',  // Deepest brown
        },
        secondary: {
          50: '#fafaf9',   // Near white
          100: '#f5f5f4',  // Light gray
          200: '#e7e5e4',  // Light brown-gray
          300: '#d6d3d1',  // Medium brown-gray
          400: '#a8a29e',  // Medium gray
          500: '#78716c',  // Brown-gray
          600: '#57534e',  // Dark brown-gray
          700: '#44403c',  // Darker brown
          800: '#292524',  // Very dark brown
          900: '#1c1917',  // Near black brown
          950: '#0c0a09',  // Deep black brown
        },
        accent: {
          50: '#fefce8',   // Light yellow accent
          100: '#fef9c3',  // Cream yellow
          200: '#fef08a',  // Light amber
          300: '#fde047',  // Medium amber
          400: '#facc15',  // Bright amber
          500: '#eab308',  // Main accent amber
          600: '#ca8a04',  // Dark amber
          700: '#a16207',  // Brown amber
          800: '#854d0e',  // Dark brown amber
          900: '#713f12',  // Deep brown amber
          950: '#422006',  // Deepest brown amber
        },
        surface: {
          light: '#fefdfb',    // Light surface
          DEFAULT: '#f8f6f3',  // Default surface
          dark: '#2d2621',     // Dark surface
          darker: '#1f1b17',   // Darker surface
        },
        error: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#991b1b',
        },
        success: {
          light: '#d1fae5',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#d97706',
          dark: '#92400e',
        },
        info: {
          light: '#dbeafe',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-warm": "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        "gradient-surface": "linear-gradient(to bottom, #fefdfb, #f8f6f3)",
        "gradient-dark": "linear-gradient(135deg, #2d2621 0%, #1f1b17 100%)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-strong': '0 0 30px rgba(251, 191, 36, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
export default config;
