import axiosInstance from './axiosInstance'; // ✅ ใช้ตัวกลาง

export const createPromptPayQR = async (amount, bookingId) => {
    // ✅ ไม่ต้องส่ง headers เอง, axiosInstance จัดการให้
    const response = await axiosInstance.post('/payment/create-qr', { 
        amount, 
        bookingId 
    });
    return response.data;
};

export const checkPaymentStatus = async (chargeId) => {
    const response = await axiosInstance.get(`/payment/status/${chargeId}`);
    return response.data;
};