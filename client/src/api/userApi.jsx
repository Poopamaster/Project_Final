import axiosInstance from './axiosInstance'; 


export const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/users/login', {
    email,
    password,
  });
  return response.data;
};

export const googleLoginUser = async (accessToken) => {
  const response = await axiosInstance.post('/users/google-login', {
    accessToken,
  });
  return response.data;
};

export const registerUser = async (userData) => {
    const response = await axiosInstance.post('/users', userData); 
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await axiosInstance.post('/users/forgot-password', { email }); 
    return response.data;
};

export const resetPassword = async (token, newPassword) => {
    const response = await axiosInstance.put(`/users/reset-password/${token}`, { 
        password: newPassword 
    }); 
    return response.data;
};