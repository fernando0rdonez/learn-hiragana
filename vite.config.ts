import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/learn-hiragana/',
  plugins: [
    tailwindcss(),
    react(),
  ],
})
