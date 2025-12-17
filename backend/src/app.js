const express = require('express');
const cors = require('cors');

const movieRoutes = require('./routes/movieRoutes');
const userRoutes = require('./routes/userRoutes');
const logger = require('./middleware/logger');
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

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(express.json());
app.use(logger);



// Routes
app.use('/api/movies', movieRoutes); // เพิ่ม Endpoint หนัง
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/auditoriums', auditoriumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.use("/api/mcp", mcpRoutes);
app.use("/api/chatbot", chatbotRoutes);

module.exports = app;