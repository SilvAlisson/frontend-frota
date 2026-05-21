import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Define que queremos perguntar ao usuário para atualizar
      injectRegister: 'auto',
      workbox: {
        // Padrões de arquivos que serão geridos pelo cache do Service Worker
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true, // Limpa o lixo antigo automaticamente
      },
      manifest: {
        name: 'KLIN Frota',
        short_name: 'KLIN',
        description: 'Sistema Operacional e Gestão de Frota',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
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