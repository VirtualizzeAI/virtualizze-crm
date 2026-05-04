import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12131a',
        mist: '#eef4f1',
        clay: '#d7b98f',
        pine: '#1f5c4a',
        coral: '#db6b57',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(18, 19, 26, 0.14)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config