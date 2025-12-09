// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // เรียกใช้ URL จากไฟล์ .env
        const conn = await mongoose.connect(process.env.MONGO_URI); 
        
        console.log(`MongoDB Connected Successfully`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;