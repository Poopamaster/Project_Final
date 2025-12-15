const express = require('express');
const router = express.Router();
const { createBooking, getBookedSeatsByShowtime, getUserBookings, getBookingById } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');
// Public
router.get('/showtime/:showtimeId', getBookedSeatsByShowtime); // เช็คที่นั่งไม่ว่าง

// Private (ต้อง Login)
router.post('/', authenticate, createBooking);          // กดจอง
router.get('/my-bookings', authenticate, getUserBookings); // ดูประวัติ
router.get('/:id', authenticate, getBookingById);       // ดูรายละเอียด

module.exports = router;