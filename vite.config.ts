import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        injectionPoint: undefined
      },
      includeAssets: ['logo.png', 'vite.svg'],
      manifest: {
        name: 'KLIN - Gestão de Frota',
        short_name: 'KLIN Frota',
        description: 'Sistema integrado de gestão de frota, jornadas, manutenções e abastecimentos.',
        theme_color: '#52638a',
        background_color: '#121214',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: true, // <--- ADICIONE ESTA LINHA PARA A VERCEL GERAR O MAPA
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-excel': ['exceljs', 'file-saver'],
          'vendor-ui': ['lucide-react', 'sonner', 'date-fns']
        }
      }
    }
  }
})