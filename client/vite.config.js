// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()], 
    server: {
      host: true,
      proxy: {
        '/api': {
          // 1. ตรวจสอบให้มั่นใจว่าพอร์ตคือ 8000 ตามใน server.js
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // 2. *** สำคัญมาก: เอาบรรทัด rewrite ออก *** // เพราะใน app.js ของคุณมีคำว่า /api นำหน้าอยู่แล้ว
        },
      }
    }
  }
})