import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url));

// During development the API runs on port 3000 (npm run dev starts both).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(here, 'src') },
  },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
