// src/api/chatbotApi.js
import axiosInstance from './axiosInstance';

// ตรวจสอบ URL ให้ตรงกับ Backend ของคุณ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper สำหรับดึง Token
const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) throw new Error("No token found");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// 1. ส่งข้อความ (คุยกับ Bot)
export const sendMessageToBot = async (message, imageBase64 = null) => {
    try {
        const response = await axiosInstance.post(
            `/chatbot/chat`, // ❌ ไม่ต้องใส่ ${API_URL} แล้ว เพราะ axiosInstance จัดการให้
            { message, image: imageBase64 }
        );
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

// 2. ✅ ดึงประวัติการสนทนา (GET)
export const getChatHistory = async () => {
    try {
        const response = await axiosInstance.get(`/chatbot/chathistory`); 
        return response.data;
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

// 3. ✅ ล้างประวัติ (DELETE)
export const clearChatHistory = async () => {
    try {
        await axiosInstance.delete(`/chatbot/chathistory`);
        return true;
    } catch (error) {
        console.error("Error clearing history:", error);
        return false;
    }
};

export const importExcelMovies = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // ✅ ใช้ axiosInstance แทน axios เพียวๆ
        const response = await axiosInstance.post(
            '/admin/import-excel', 
            formData,
            {
                headers: {
                    // ✅ ไม่ต้องใส่ Authorization เองแล้ว เพราะ axiosInstance ใส่ให้จาก localStorage แล้ว
                    'Content-Type': 'multipart/form-data' 
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error importing excel:", error);
        throw error.response ? error.response.data : error;
    }
};