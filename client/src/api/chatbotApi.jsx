// src/api/chatbotApi.js
import axios from 'axios';

// ตรวจสอบ URL ให้ตรงกับ Backend ของคุณ
const API_URL = 'http://localhost:5000/api'; 

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
    const response = await axios.post(
      `${API_URL}/chatbot/chat`,
      { message, image: imageBase64 },
      getAuthHeaders()
    );
    return response.data; 
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// 2. ✅ ดึงประวัติการสนทนา (GET)
export const getChatHistory = async () => {
    try {
        const response = await axios.get(`${API_URL}/chatbot/chathistory`, getAuthHeaders());
        return response.data; // ส่งกลับเป็น Array ของ messages
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

// 3. ✅ ล้างประวัติ (DELETE)
export const clearChatHistory = async () => {
    try {
        await axios.delete(`${API_URL}/chatbot/chathistory`, getAuthHeaders());
        return true;
    } catch (error) {
        console.error("Error clearing history:", error);
        return false;
    }
};