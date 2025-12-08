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
        'emidias-primary': '#06055B',
        'emidias-primary-light': '#0A0980',
        'emidias-accent': '#FC1E75',
        'emidias-success': '#059669',
        'emidias-success-light': '#10B981',
        'emidias-danger': '#DC2626',
        'emidias-gray': '#64748B',
        'emidias-light-gray': '#F1F5F9',
        'emidias-medium-gray': '#E2E8F0',
        'emidias-dark-gray': '#475569',
        'emidias-white': '#FFFFFF',
        'emidias-dark': '#1E293B',
        'emidias-bg': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(6, 5, 91, 0.06)',
        'emidias': '0 4px 12px rgba(6, 5, 91, 0.1)',
      },
    },
  },
  plugins: [],
}
