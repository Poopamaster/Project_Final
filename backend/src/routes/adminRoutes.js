const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const showtimeController = require('../controllers/showtimeController'); 
const { authenticate } = require('../middleware/authMiddleware');


router.get('/movies', adminController.getAllMovies);

router.get('/search-tmdb', adminController.searchTMDB);
router.post('/movies/add-tmdb', adminController.addMovieFromTMDB);

// 2. เพิ่มหนังใหม่ลง Database
router.post('/movies', adminController.createMovie);

// 3. ดึงรายการหนังทั้งหมด
router.get('/movies', adminController.getAllMovies);

// 4. ลบหนังออกจากระบบ
router.delete('/movies/:id', adminController.deleteMovie);


// --- ส่วนสถิติและรายงาน (Dashboard & Bookings) ---
// 5. ดึงข้อมูลสถิติยอดขาย, ตั๋ว, และจำนวนผู้ใช้ (สำหรับหน้า Dashboard)
router.get('/stats', adminController.getDashboardStats);

// 6. ดึงรายการการจองทั้งหมด (สำหรับหน้า Bookings)
router.get('/bookings', adminController.getAllBookings);


// --- ส่วนจัดการผู้ใช้ (Users) ---
// 7. ดึงรายชื่อลูกค้าทั้งหมด (สำหรับหน้า Customers)
router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getReports);
router.get('/list', adminController.getAllAdmins);
router.post('/add', adminController.addAdmin);
router.post('/promote', adminController.promoteAdmin);
// เพิ่มลงในไฟล์ adminRoutes.js
router.delete('/delete/:id', adminController.deleteAdmin);

router.post('/showtimes', showtimeController.createShowtime);
router.delete('/showtimes/:id', showtimeController.deleteShowtime);





module.exports = router;