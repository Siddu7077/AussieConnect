import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Port must match the CORS origin in api/config.php
  server: { port: 5173, strictPort: true },
});
