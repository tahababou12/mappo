import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',                // already needed to bind outside localhost
    port: 5173,
    strictPort: true,               // optional: fail if 5173 is busy
    hmr: {
      host: 'mhall.bragai.tech',    // ensure HMR websocket connects back to your domain
      protocol: 'wss',              // secure websocket
    },
    allowedHosts: [
      'mhall.bragai.tech',          // HTTP(S) requests from this host will be accepted
      'localhost:3001'              // you can keep localhost too
    ]
  }
})
