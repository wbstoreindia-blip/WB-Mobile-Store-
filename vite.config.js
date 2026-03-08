import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This allows you to view the site on your phone's browser if using a local network
    host: true,
    port: 5173,
  },
  build: {
    // This ensures your final website files are optimized and small
    outDir: 'dist',
    sourcemap: false,
  },
})
