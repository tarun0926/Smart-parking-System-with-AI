import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Development server ────────────────────────────────────────────────────
  server: {
    port: 3000,
    proxy: {
      // In dev: proxy /api requests to the local Express backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },

  // ── Production build ──────────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },

  // ── Preview server (vite preview) ────────────────────────────────────────
  preview: {
    port: 4173,
    host: true,
  },
})
