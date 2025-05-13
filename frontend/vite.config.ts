import { defineConfig, loadEnv } from 'vite'
// Provide a stub for Node's process in Vite config
declare const process: any;
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars to access VITE_API_URL
  const env = loadEnv(mode, process.cwd(), '');
  // Determine API URL for proxy (fallback to localhost:8000 if not provided)
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Public API endpoints (user-facing)
        '/tickets': {
          target: apiUrl,
          changeOrigin: true,
        },
        // Admin API endpoints
        '/admin/tickets': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/admin/search': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
