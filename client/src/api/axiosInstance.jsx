// ไฟล์: src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
    (config) => {
        // ✅ ใช้ชื่อ key ว่า 'jwtToken' ให้ตรงกันทั้งระบบ
        const token = localStorage.getItem('jwtToken'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // 🔥 Token หมดอายุ: เคลียร์ทุกอย่างแล้วดีดออก
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('user');
            
            // ใช้ window.location เพื่อรีเฟรช State ของ React ใหม่ทั้งหมด
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;