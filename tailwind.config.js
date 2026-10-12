/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        'off-white': '#EEEBE6',
        mint: '#B6DFB2',
        sage: '#7AAB88',
        'deep-green': '#125747',
        charcoal: '#1E1E1E',
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
        brand: 'var(--c-brand)',
        'brand-ink': 'var(--c-brand-ink)',
        'on-brand': 'var(--c-on-brand)',
        enough: { DEFAULT: 'var(--c-enough)', text: 'var(--c-enough-text)', soft: 'var(--c-enough-soft)' },
        tight: { DEFAULT: 'var(--c-tight)', text: 'var(--c-tight-text)', soft: 'var(--c-tight-soft)' },
        short: { DEFAULT: 'var(--c-short)', text: 'var(--c-short-text)', soft: 'var(--c-short-soft)' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Public Stunt"', '"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(30,30,30,0.04), 0 4px 16px rgba(30,30,30,0.05)',
        lift: '0 2px 4px rgba(30,30,30,0.05), 0 12px 32px rgba(30,30,30,0.09)',
      },
      maxWidth: { app: '1360px' },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        rise: 'rise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        fade: 'fade 300ms ease-out both',
        'slide-in': 'slideIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-up': 'slideUp 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
