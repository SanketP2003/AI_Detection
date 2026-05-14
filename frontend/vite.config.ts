import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 3000),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/login': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/logout': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/actuator': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/v3/api-docs': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/swagger-ui': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
