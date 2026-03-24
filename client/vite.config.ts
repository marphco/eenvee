import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    proxy: {
      '/api': {
         target: 'http://localhost:4000',
         changeOrigin: true,
      },
      '/uploads': {
         target: 'http://localhost:4000',
         changeOrigin: true,
      }
    },
    hmr: {
      clientPort: 5173, // Ensure HMR connects to the correct port
    }
  },
});
