import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000/api'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/theme': path.resolve(__dirname, './src/theme'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      },
    },
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      hmr: {
        overlay: true,
      },
      // Proxy only for local development (without Docker)
      proxy: apiUrl !== '/api' ? {
        '/api': {
          target: apiUrl.replace('/api', ''),
          changeOrigin: true,
          rewrite: (path) => path,
        },
      } : undefined,
      watch: {
        usePolling: false,
      },
    },
  }
})

