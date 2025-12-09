import axios from 'axios';

const BASE_URL = "http://localhost:5000/api/payment"; 

export const createPromptPayQR = async (amount) => {
    const response = await axios.post(`${BASE_URL}/create-qr`, { amount });
    return response.data;
};

export const checkPaymentStatus = async (chargeId) => {
    const response = await axios.get(`${BASE_URL}/status/${chargeId}`);
    return response.data;
};