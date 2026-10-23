/** @type {import('tailwindcss').Config} */
const ch = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Every colour comes from the tokens in src/styles/index.css. No fixed palette.
      colors: {
        bg: ch('bg'),
        surface: { DEFAULT: ch('surface-1'), 2: ch('surface-2'), 3: ch('surface-3') },
        line: { DEFAULT: ch('border'), strong: ch('border-strong') },
        ink: ch('text'),
        muted: ch('text-muted'),
        subtle: ch('text-subtle'),
        accent: { DEFAULT: ch('accent'), soft: 'var(--color-accent-soft)' },
        'on-accent': ch('on-accent'),
        // Text-safe blue for links and small text; the accent itself is for fills, borders and focus.
        link: ch('link'),
        // Destructive actions and errors: a fill with its on-colour, and a text-safe variant.
        danger: { DEFAULT: ch('danger'), text: ch('danger-text') },
        'on-danger': ch('on-danger'),
        enough: { DEFAULT: ch('enough'), soft: 'var(--color-enough-soft)' },
        tight: { DEFAULT: ch('tight'), soft: 'var(--color-tight-soft)' },
        short: { DEFAULT: ch('short'), soft: 'var(--color-short-soft)' },
        scrim: 'rgb(var(--scrim) / var(--scrim-a))',
      },
      // A touch lighter than the standard scale for a sleeker look; both fonts are variable, so these render exactly.
      fontWeight: { normal: '380', medium: '470', semibold: '565', bold: '660', extrabold: '760' },
      fontFamily: {
        sans: ['var(--font-body)'],
        heading: ['var(--font-heading)'],
      },
      fontSize: {
        // Fluid type scale. Never below 12px.
        display: ['clamp(2.75rem, 1.6rem + 4.6vw, 5.5rem)', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '660' }],
        h1: ['clamp(2rem, 1.6rem + 1.4vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '660' }],
        h2: ['clamp(1.375rem, 1.2rem + 0.6vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '615' }],
        h3: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '565' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: {
        card: 'none',
        lift: '0 12px 32px -12px rgb(0 0 0 / 0.25)',
      },
      maxWidth: { app: '1360px' },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        page: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'none' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        rise: 'rise 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        fade: 'fade 200ms ease-out both',
        page: 'page 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-in': 'slideIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-up': 'slideUp 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
