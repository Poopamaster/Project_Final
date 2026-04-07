import axiosInstance from './axiosInstance';

export const getAllCinemas = async () => {
    try {
        const response = await axiosInstance.get('/cinemas');
        // ต้อง return array ออกไป (เช็ค structure json ดีๆ)
        return response.data.data || response.data; 
    } catch (error) {
        console.error("Error fetching cinemas:", error);
        throw error;
    }
};