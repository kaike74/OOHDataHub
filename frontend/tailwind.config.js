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
        // Cores Primárias E-MÍDIAS
        'emidias-primary': '#06055B',
        'emidias-primary-light': '#0A0980',
        'emidias-primary-dark': '#040340',
        'emidias-accent': '#FC1E75',
        'emidias-accent-light': '#FF4D95',
        'emidias-accent-dark': '#E01863',

        // Cores de Status Refinadas
        'emidias-success': '#10B981',
        'emidias-success-light': '#34D399',
        'emidias-success-dark': '#059669',
        'emidias-warning': '#F59E0B',
        'emidias-warning-light': '#FBBF24',
        'emidias-danger': '#EF4444',
        'emidias-danger-light': '#F87171',
        'emidias-info': '#3B82F6',
        'emidias-info-light': '#60A5FA',

        // Tons Neutros Sofisticados
        'emidias-gray': {
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
        'emidias-white': '#FFFFFF',
        'emidias-dark': '#1E293B',
        'emidias-bg': '#F8FAFC',
        'emidias-light-gray': '#F1F5F9',
        'emidias-medium-gray': '#E2E8F0',
        'emidias-dark-gray': '#475569',
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
        'card': '0 2px 8px rgba(6, 5, 91, 0.06)',
        'emidias': '0 4px 12px rgba(6, 5, 91, 0.1)',
        'emidias-xs': '0 1px 2px rgba(6, 5, 91, 0.03)',
        'emidias-sm': '0 2px 4px rgba(6, 5, 91, 0.05)',
        'emidias-md': '0 4px 8px rgba(6, 5, 91, 0.08)',
        'emidias-lg': '0 8px 24px rgba(6, 5, 91, 0.12)',
        'emidias-xl': '0 16px 32px rgba(6, 5, 91, 0.16)',
        'emidias-2xl': '0 24px 48px rgba(6, 5, 91, 0.20)',
        'accent': '0 8px 24px rgba(252, 30, 117, 0.25)',
        'accent-lg': '0 12px 32px rgba(252, 30, 117, 0.30)',
        'glow': '0 0 40px rgba(252, 30, 117, 0.3)',
        'inner-soft': 'inset 0 2px 4px rgba(6, 5, 91, 0.06)',
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
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(252, 30, 117, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(252, 30, 117, 0.6))' },
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
        'gradient-primary': 'linear-gradient(135deg, #06055B 0%, #0A0980 100%)',
        'gradient-primary-full': 'linear-gradient(135deg, #06055B 0%, #0A0980 50%, #FC1E75 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FC1E75 0%, #FF4D95 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
}
