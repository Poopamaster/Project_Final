import { defineConfig, loadEnv } from 'vite' // 1. เพิ่ม loadEnv เข้ามา
import vue from '@vitejs/plugin-vue'         // ✅ ใช้ plugin-vue เหมือนเดิม

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 2. โหลดค่าจากไฟล์ .env (ถ้ามี)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue()], // ✅ ตรงนี้ต้องเป็น vue() ครับ ห้ามแก้เป็น react()
    server: {
      host: true, // เปิดให้มือถือเข้าได้
      proxy: {
        '/api': {
          // 3. ตั้งค่า Proxy ไปหา Backend
          // ถ้าในไฟล์ .env มีค่า VITE_API_URL ก็จะใช้ค่านั้น
          // ถ้าไม่มี ก็จะใช้ http://localhost:5000 เป็นค่าเริ่มต้น
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      }
    }
  }
})