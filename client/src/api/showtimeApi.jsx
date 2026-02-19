import axiosInstance from './axiosInstance';

// ✅ เพิ่มฟังก์ชันนี้เข้าไป! สำหรับดึงรอบฉายทั้งหมดมาใช้ Filter หน้า MoviePage
export const getAllShowtimes = async () => {
    try {
        const response = await axiosInstance.get('/showtimes');
        return response.data.data || response.data;
    } catch (error) {
        console.error("Error fetching all showtimes:", error);
        return [];
    }
};

// --- อันเดิมของคุณที่มีอยู่แล้ว ---
export const getShowtimesByMovieId = async (movieId) => {
    try {
        const response = await axiosInstance.get(`/showtimes/movie/${movieId}`);
        return response.data.data || response.data;
    } catch (error) {
        console.error("Error fetching showtimes:", error);
        return [];
    }
};

export const getReservedSeats = async (showtimeId) => {
    try {
        const response = await axiosInstance.get(`/bookings/showtime/${showtimeId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching reserved seats:", error);
        throw error;
    }
};

export const getSeatsByShowtimeId = async (showtimeId) => {
    try {
        const response = await axiosInstance.get(`/showtimes/${showtimeId}/seats`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching seat layout:", error);
        return [];
    }
};