import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 25px 70px rgba(15, 36, 76, 0.11)',
        glow: '0 0 20px rgba(59, 130, 246, 0.15)'
      },
      backgroundImage: {
        'glass-gradient': 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.15), transparent 26%)'
      }
    }
  },
  plugins: []
}

export default config
