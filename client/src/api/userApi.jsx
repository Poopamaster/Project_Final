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