import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://gotify.zerka.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');

            proxyReq.setHeader('Origin', 'https://gotify.zerka.dev');
            proxyReq.setHeader('Referer', 'https://gotify.zerka.dev/');

            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }

          });
        }
      },
      '/message': {
        target: 'https://gotify.zerka.dev',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
