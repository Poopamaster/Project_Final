import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react' 

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()], 
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      host: true,
      // ✅ เพิ่มบรรทัดนี้เพื่อแก้ Blocked request ในโหมด dev (ถ้ามี)
      allowedHosts: true, 
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      }
    },
    // ✅ เพิ่มส่วนนี้เข้าไป (สำคัญมากสำหรับ Railway)
    preview: {
      allowedHosts: true // หรือใส่ ['profound-enchantment-production-90c0.up.railway.app']
    }
  }
})