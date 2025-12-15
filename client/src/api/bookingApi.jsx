import axiosInstance from './axiosInstance';

export const createBooking = async (bookingData) => {
    try {
        const response = await axiosInstance.post('/bookings', bookingData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};