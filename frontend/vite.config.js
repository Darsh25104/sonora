import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api and /uploads to the Express server during
// development, so the frontend can use relative URLs and there is no CORS
// headache. In production, set VITE_API_BASE_URL instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
