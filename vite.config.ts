import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Common proxy configuration for all Gotify endpoints
const commonProxyConfig = {
  target: 'https://gotify.zerka.dev',
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      // Forward authentication headers
      if (req.headers['x-gotify-key']) {
        proxyReq.setHeader('X-Gotify-Key', req.headers['x-gotify-key']);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }

      // Modify Origin and Referer headers to match target
      proxyReq.setHeader('Origin', 'https://gotify.zerka.dev');
      if (req.headers.referer) {
        proxyReq.setHeader('Referer', req.headers.referer.replace('http://localhost:5173', 'https://gotify.zerka.dev'));
      }
    });

    // Add CORS headers for development
    proxy.on('proxyRes', (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,X-Gotify-Key';
      proxyRes.headers['Access-Control-Max-Age'] = '1728000';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    });
  }
};

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
        ...commonProxyConfig,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/message': commonProxyConfig,
      '/client': {
        ...commonProxyConfig,
        // Add specific OPTIONS handling for preflight requests
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward authentication headers
            if (req.headers['x-gotify-key']) {
              proxyReq.setHeader('X-Gotify-Key', req.headers['x-gotify-key']);
            }
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            // Modify Origin and Referer headers to match target
            proxyReq.setHeader('Origin', 'https://gotify.zerka.dev');
            if (req.headers.referer) {
              proxyReq.setHeader('Referer', req.headers.referer.replace('http://localhost:5173', 'https://gotify.zerka.dev'));
            }
          });

          proxy.on('proxyRes', (proxyRes, req) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,X-Gotify-Key';
            proxyRes.headers['Access-Control-Max-Age'] = '1728000';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';

            // Handle OPTIONS requests
            if (req.method === 'OPTIONS') {
              proxyRes.statusCode = 204;
            }
          });
        }
      },
      '/image': {
        target: 'https://gotify.zerka.dev',
        changeOrigin: true
      },
      '/stream': {
        target: 'https://gotify.zerka.dev',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            if (req.headers['x-gotify-key']) {
              proxyReq.setHeader('X-Gotify-Key', req.headers['x-gotify-key']);
            }
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      }
    }
  }
})
