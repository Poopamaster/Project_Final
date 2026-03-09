// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // ลองใส่ชื่อ db เข้าไปใน options อีกชั้นเพื่อบังคับ (Explicitly specify dbName)
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'mcp_cinema', // 👈 ใส่ชื่อ Database ที่คุณต้องการตรงนี้เลย
            family: 4 
        }); 
        
        console.log(`MongoDB Connected to DB: ${conn.connection.db.databaseName}`); // 👈 ให้มัน Print ชื่อ DB ออกมาดูเลย
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;