// src/api/chatbotApi.js
import axios from 'axios';

// กำหนด Base URL (ถ้าคุณมี axiosInstance อยู่แล้ว ให้ import มาใช้แทน axios ตรงนี้ได้เลย)
const API_URL = 'http://localhost:5000/api'; 

export const sendMessageToBot = async (message) => {
  try {
    const token = localStorage.getItem('jwtToken'); // ดึง Token ล่าสุดเสมอ

    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.post(
      `${API_URL}/chatbot/chat`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data; // ส่งกลับเฉพาะ data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};