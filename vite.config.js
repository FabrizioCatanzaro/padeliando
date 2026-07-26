import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Por defecto Vite inlinea como base64 todo asset de menos de 4 KB. Los
    // avatares del modal premium entran en ese umbral y engordaban el chunk
    // principal —que es bloqueante— con imágenes que sólo se ven al abrir ese
    // modal. Con 2 KB se inlinean sólo los assets verdaderamente diminutos.
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // React y el router cambian con sus versiones, no con cada deploy de
        // producto: en su propio chunk sobreviven en la caché del navegador
        // cuando se publica código nuevo. Recharts va aparte porque pesa
        // 302 KB y sólo lo usan las vistas de estadísticas y de perfil.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'vendor-charts'
          if (id.includes('react-router')) return 'vendor-react'
          if (/node_modules[/\\](react|react-dom|scheduler)[/\\]/.test(id)) return 'vendor-react'
        },
      },
    },
  },
})