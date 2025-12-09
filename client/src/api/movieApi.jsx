// ไฟล์: src/api/movieApi.js
import axiosInstance from './axiosInstance'; // ✅ เปลี่ยนมาใช้อันนี้

// ดึงข้อมูลหนังทั้งหมด
export const getAllMovies = async () => {
    try {
        const response = await axiosInstance.get('/movies'); // ไม่ต้องใส่ Base URL แล้ว เพราะตั้งไว้ใน instance แล้ว
        return response.data;
    } catch (error) {
        console.error("Error fetching movies:", error);
        throw error;
    }
};