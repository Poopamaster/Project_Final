// src/api/bookingApi.js
import axiosInstance from './axiosInstance';

// ฟังก์ชันจองตั๋ว (ที่มีอยู่แล้ว)
export const createBooking = async (bookingData) => {
    try {
        const response = await axiosInstance.post('/bookings', bookingData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

// ✅ เพิ่มฟังก์ชันนี้: ดึงประวัติการจอง
export const getMyBookings = async () => {
    try {
        // ยิงไปที่ Route: router.get('/my-bookings', ...) ที่เราทำไว้ใน Backend
        // สมมติว่า axiosInstance ตั้ง baseURL ไว้แล้ว และ prefix คือ /bookings
        const response = await axiosInstance.get('/bookings/my-bookings'); 
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

// (Optional) ฟังก์ชันดึงรายละเอียดใบเสร็จรายใบ
export const getBookingById = async (id) => {
    try {
        const response = await axiosInstance.get(`/bookings/${id}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};