// src/api/chatbotApi.js (แก้ใหม่)
import axios from 'axios';
const API_URL = 'http://localhost:5000/api'; 

// เพิ่ม parameter imageBase64 (default เป็น null)
export const sendMessageToBot = async (message, imageBase64 = null) => {
  try {
    const token = localStorage.getItem('jwtToken'); 
    if (!token) throw new Error("No token found");

    const response = await axios.post(
      `${API_URL}/chatbot/chat`,
      { 
          message, 
          image: imageBase64 // ส่งรูปไปด้วย
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data; 
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};