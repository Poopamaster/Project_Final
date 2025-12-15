import axiosInstance from './axiosInstance';

export const getShowtimesByMovieId = async (movieId) => {
    try {
        const response = await axiosInstance.get(`/showtimes?movie_id=${movieId}`);
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