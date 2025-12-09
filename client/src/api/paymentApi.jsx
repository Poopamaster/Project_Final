// ไฟล์: src/api/paymentApi.js
import axios from 'axios';

// ตรวจสอบ Port ให้ตรงกับ Backend (5000)
const BASE_URL = "http://localhost:5000/api/payment"; 

// ✅ 1. ประกาศฟังก์ชัน Helper สำหรับดึง Token ก่อน
const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    // ส่ง Token ไปในรูปแบบ Bearer Token
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ✅ 2. ฟังก์ชันสร้าง QR Code (รับ amount และ bookingId)
export const createPromptPayQR = async (amount, bookingId) => {
    // เรียกใช้ getAuthHeaders() ตรงนี้
    const response = await axios.post(
        `${BASE_URL}/create-qr`, 
        { amount, bookingId }, 
        { headers: getAuthHeaders() } // <--- แนบ Header ไปด้วย
    );
    return response.data;
};

// ✅ 3. ฟังก์ชันเช็คสถานะ
export const checkPaymentStatus = async (chargeId) => {
    // การเช็คสถานะอาจไม่ต้องใช้ Token (แล้วแต่ Backend design) 
    // แต่ถ้า Backend บังคับ login ก็ให้ใส่ headers: getAuthHeaders() เพิ่มเข้าไป
    const response = await axios.get(`${BASE_URL}/status/${chargeId}`);
    return response.data;
};