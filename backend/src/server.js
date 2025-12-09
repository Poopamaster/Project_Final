// src/server.js
require('dotenv').config(); // <--- เพิ่มบรรทัดนี้ไว้บนสุด!

const app = require('./app');
const connectDB = require('./config/db');

// อ่าน PORT จาก .env ถ้าไม่มีให้ใช้ 5173
const PORT = process.env.PORT || 5173; 

// เชื่อมต่อ Database
connectDB();

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});