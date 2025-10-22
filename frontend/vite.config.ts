import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Provide a global variable for libraries expecting a Node-like global
    global: 'window',
  },
  optimizeDeps: {
    // Pre-bundle sockjs-client and stompjs to avoid runtime resolution issues
    include: ['sockjs-client', '@stomp/stompjs'],
  },
  resolve: {
    // Vite 3+ doesn't automatically polyfill node built-ins; map common modules to browser-safe options if needed
    alias: {
      // if any library expects crypto, point to the browser's subtle API via a tiny shim (not added here)
    },
  },
})
