import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    global: {}, // Define global to avoid issues with certain libraries
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
    },
  },
  server: {
    host: '0.0.0.0', 
    port: 5173,
    hmr: {
      port: 5173,
      clientPort: 5173
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
})
