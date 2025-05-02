import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Vite already loads variables from .env files automatically
  // with the VITE_ prefix, so we don't need to define them explicitly
})
