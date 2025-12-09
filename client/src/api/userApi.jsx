import axios from "axios";

const BASE_URL = "http://localhost:5000/api/users";

export const loginUser = async (email, password) => {
  // ยิง Request ไปที่ Backend
  const response = await axios.post(`${BASE_URL}/login`, {
    email,
    password,
  });
  
  return response.data;
};

export const googleLoginUser = async (accessToken) => {
  const response = await axios.post(`${BASE_URL}/google-login`, {
    accessToken,
  });
  return response.data;
};

export const registerUser = async (userData) => {
    // ยิง POST request ไปที่ /api/users (Endpoint สำหรับ Create User)
    const response = await axios.post(`${BASE_URL}`, userData); 
    return response.data;
};

export const forgotPassword = async (email) => {
    // Endpoint นี้จะถูกสร้างใน Backend (Controller) ในขั้นตอนถัดไป
    const response = await axios.post(`${BASE_URL}/forgot-password`, { email }); 
    return response.data;
};

export const resetPassword = async (token, newPassword) => {
    // Endpoint นี้จะถูกสร้างใน Backend
    const response = await axios.put(`${BASE_URL}/reset-password/${token}`, { 
        password: newPassword 
    }); 
    return response.data;
};