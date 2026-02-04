import axiosInstance from './axiosInstance'; // ✅ ใช้ตัวกลาง

export const createPromptPayQR = async (amount, bookingId) => {
    console.log("💸 กำลังสร้าง QR Code...");
    console.log("💰 Amount (บาท):", amount, "| Type:", typeof amount);
    console.log("🆔 Booking ID:", bookingId);

    // เช็คดักก่อนส่ง
    if (!amount || amount < 20) {
        console.error("❌ ยอดเงินน้อยกว่า 20 บาท หรือเป็น 0");
    }
    if (!bookingId) {
        console.error("❌ ไม่มี Booking ID");
    }

    try {
        const response = await axiosInstance.post('/payment/create-qr', {
            amount,
            bookingId
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error สร้าง QR:", error.response?.data || error.message);
        throw error;
    }
};

export const checkPaymentStatus = async (chargeId) => {
    const response = await axiosInstance.get(`/payment/status/${chargeId}`);
    return response.data;
};

export const simulatePaymentSuccess = async (chargeId) => {
    const response = await axiosInstance.post('/payment/simulate-success', { chargeId });
    return response.data;
};