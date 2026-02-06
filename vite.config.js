import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/all-funds': {
        target: 'http://fund.eastmoney.com/js/fundcode_search.js',
        changeOrigin: true,
        rewrite: () => '' // 直接映射到 target
      },
      '/api/valuation': {
        target: 'http://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/valuation/, '/js')
      },
      '/api/pingzhongdata': {
        target: 'http://fund.eastmoney.com/pingzhongdata',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pingzhongdata/, '')
      },
      '/api/f10': {
        target: 'http://api.fund.eastmoney.com/f10',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/f10/, ''),
        headers: {
          Referer: 'http://fundf10.eastmoney.com/'
        }
      }
    }
  }
})
