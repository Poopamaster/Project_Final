import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
    (config) => {
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
        // ✅ เช็คว่าเป็น 401 จาก API ที่ไม่ใช่ /login
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            
            // 🔥 ถ้าไม่ใช่หน้า login → token หมดอายุ → ดีดออก
            if (!requestUrl.includes('/login')) {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            // ✅ ถ้าเป็นหน้า login → ปล่อยให้ component จัดการเอง
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;