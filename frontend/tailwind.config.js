const floor = require('./src/styles/design-floor/tailwind/v3.config.snippet.js')

// Thai floor (ADR-0007, FLOOR.md): every text size takes its line-height from the design-floor
// tokens instead of Tailwind's Latin defaults (body >= 1.6, headings >= 1.3). Sizes are unchanged.
const thaiBody = { lineHeight: 'var(--leading-thai)' }
const thaiHeading = { lineHeight: 'var(--leading-thai-heading)' }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Floor snippet uses data-theme; the class toggle stays for existing `dark:` styles
  // (settings page sets the class directly), so both selectors apply.
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Only the colour and font names from the floor snippet. Its borderRadius and boxShadow
      // keys would replace Tailwind's rounded-lg/shadow-lg for every page (visual change), so
      // they stay out until a deliberate restyle (see frontend/DESIGN.md "Tokens").
      colors: floor.theme.extend.colors,
      fontFamily: { sans: floor.theme.extend.fontFamily.sans },
      fontSize: {
        xs: ['0.75rem', thaiBody],
        sm: ['0.875rem', thaiBody],
        base: ['1rem', thaiBody],
        lg: ['1.125rem', thaiBody],
        xl: ['1.25rem', thaiBody],
        '2xl': ['1.5rem', thaiHeading],
        '3xl': ['1.875rem', thaiHeading],
        '4xl': ['2.25rem', thaiHeading],
        '5xl': ['3rem', thaiHeading],
        '6xl': ['3.75rem', thaiHeading],
        '7xl': ['4.5rem', thaiHeading],
        '8xl': ['6rem', thaiHeading],
        '9xl': ['8rem', thaiHeading],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
