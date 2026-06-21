import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-to-videos',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(301, { Location: '/videos/' });
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ],
  base: process.env.VITE_BASE_PATH || '/videos/',
})
