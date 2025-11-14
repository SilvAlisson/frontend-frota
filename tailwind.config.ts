// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Diz ao Tailwind para ler os seus componentes
  ],
  theme: {
    extend: {
      // O tema é estendido aqui OU no CSS.
      // Para manter as cores do App.tsx funcionando, vamos defini-las aqui.
      colors: {
        'klin-azul': '#007EAD',
        'klin-azul-hover': '#0C4C6C',
        'klin-gelo': '#F0F4F8',
        'klin-branco': '#FFFFFF',
      },
    },
  },
  plugins: [],
} satisfies Config