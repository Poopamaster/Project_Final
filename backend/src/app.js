const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');

// Import Routes
const movieRoutes = require('./routes/movieRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const mcpRoutes = require("./routes/mcpRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const showtimeRoutes = require('./routes/showtimeRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');
const auditoriumRoutes = require('./routes/auditoriumRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. ✅ CORS ต้องอยู่บนสุด เพื่ออนุญาตให้ Frontend คุยกับ Backend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173' || 'http://localhost:8000' || 'profound-enchantment-production-90c0.up.railway.app',
    credentials: true
}));

// 2. ✅ ลำดับของ Body Parser (ประกาศแค่อย่างละครั้งพอครับ)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. ✅ Logger และ Static Files
app.use(logger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. 🚀 Routes (ย้ายมาไว้หลัง Middleware ทั้งหมด)
app.use('/api/admin', adminRoutes); // ✅ แนะนำให้เอา Admin ไว้บนๆ เพื่อเช็ค Permission ก่อน
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/auditoriums', auditoriumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/mcp", mcpRoutes);
app.use("/api/chatbot", chatbotRoutes);

module.exports = app;