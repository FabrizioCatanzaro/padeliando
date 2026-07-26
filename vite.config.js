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
  },
})