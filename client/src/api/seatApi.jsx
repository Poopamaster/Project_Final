import axiosInstance from './axiosInstance';

// ดึงผังที่นั่งตามโรงหนัง
export const getSeatsByAuditoriumId = async (auditoriumId) => {
    try {
        const response = await axiosInstance.get(`/seats/auditorium/${auditoriumId}`);
        return response.data.data; // คืนค่า Array ของ Seat
    } catch (error) {
        console.error("Error fetching seats:", error);
        return [];
    }
};