import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  build: {
    target: 'esnext',
  },

  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // On Windows, watch for file changes using polling
      ignored: ['**/src-tauri/**'],
    },
  },
}));
