import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/stock':     { target: backendUrl, changeOrigin: true },
        '/auth':      { target: backendUrl, changeOrigin: true },
        '/watchlist': { target: backendUrl, changeOrigin: true },
        '/portfolio': { target: backendUrl, changeOrigin: true },
        '/ai-log':    { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
