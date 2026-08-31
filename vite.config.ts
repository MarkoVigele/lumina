import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PORT = 45219

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: PORT,
    strictPort: true,
  },
  preview: {
    host: true,
    port: PORT,
  },
})
