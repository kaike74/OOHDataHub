/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores Primárias PLURA
        'plura-primary': '#0c3138',
        'plura-primary-light': '#16464f',
        'plura-primary-dark': '#000000',
        'plura-accent': '#4a9d9c',
        'plura-accent-light': '#6bb3b2',
        'plura-accent-dark': '#3a7d7c',

        // Cores de Status
        'plura-success': '#10B981',
        'plura-success-light': '#34D399',
        'plura-success-dark': '#059669',
        'plura-warning': '#F59E0B',
        'plura-warning-light': '#FBBF24',
        'plura-danger': '#EF4444',
        'plura-danger-light': '#F87171',
        'plura-info': '#3B82F6',
        'plura-info-light': '#60A5FA',

        accent: {
          DEFAULT: '#4a9d9c',
          light: '#6bb3b2',
          dark: '#3a7d7c',
          subtle: '#e8f4f4',
        },
        // Tons Neutros
        'plura-gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },

        // Cores de Utilidade
        'plura-white': '#FFFFFF',
        'plura-dark': '#1E293B',
        'plura-bg': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-2': ['2.5rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(12, 49, 56, 0.06)',
        'plura': '0 4px 12px rgba(12, 49, 56, 0.1)',
        'plura-xs': '0 1px 2px rgba(12, 49, 56, 0.03)',
        'plura-sm': '0 2px 4px rgba(12, 49, 56, 0.05)',
        'plura-md': '0 4px 8px rgba(12, 49, 56, 0.08)',
        'plura-lg': '0 8px 24px rgba(12, 49, 56, 0.12)',
        'plura-xl': '0 16px 32px rgba(12, 49, 56, 0.16)',
        'plura-2xl': '0 24px 48px rgba(12, 49, 56, 0.20)',
        'accent': '0 8px 24px rgba(74, 157, 156, 0.25)',
        'accent-lg': '0 12px 32px rgba(74, 157, 156, 0.30)',
        'glow': '0 0 40px rgba(74, 157, 156, 0.3)',
        'inner-soft': 'inset 0 2px 4px rgba(12, 49, 56, 0.06)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'fade-in-scale': 'fadeInScale 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'spin-slow': 'spinSlow 3s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(6, 221, 130, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(6, 221, 130, 0.6))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '40px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0c3138 0%, #16464f 100%)',
        'gradient-primary-full': 'linear-gradient(135deg, #0c3138 0%, #16464f 50%, #06dd82 100%)',
        'gradient-accent': 'linear-gradient(135deg, #06dd82 0%, #4ffbb0 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
}
