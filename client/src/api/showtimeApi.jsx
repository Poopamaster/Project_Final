import axiosInstance from './axiosInstance';

// ✅ แก้เป็นแบบนี้ (Path Parameter)
export const getShowtimesByMovieId = async (movieId) => {
    try {
        // ต้อง slash (/) แล้วตามด้วย ID เลย
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
        return response.data.data; // API เรา return { success: true, data: [...] }
    } catch (error) {
        console.error("Error fetching seat layout:", error);
        return [];
    }
};