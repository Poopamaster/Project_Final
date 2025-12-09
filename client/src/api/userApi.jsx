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
