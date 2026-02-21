const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ เพิ่ม Multer
const path = require('path');     // ✅ เพิ่ม Path
const fs = require('fs'); // 🌟 1. เพิ่ม fs (File System) เข้ามา
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

// ==========================================
// 🛠️ ตั้งค่าการอัปโหลดไฟล์ด้วย Multer
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        
        // 🌟 2. เช็คว่ามีโฟลเดอร์ uploads หรือยัง ถ้าไม่มีให้สร้างใหม่อัตโนมัติ
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// 🚀 Routes
// ==========================================

// ตรวจสอบสิทธิ์การเป็น Admin ก่อนเข้าถึงทุก Route ด้านล่าง
// router.use(authenticate); 

// --- ส่วนจัดการภาพยนตร์ (Movies) ---
// 1. ค้นหาหนังจาก TMDB API
router.get('/search-tmdb', adminController.searchTMDB);
router.post('/movies/add-tmdb', adminController.addMovieFromTMDB);

// 2. เพิ่มหนังใหม่ลง Database (✅ เพิ่ม upload.single('poster') คั่นกลาง)
router.post('/movies', upload.single('poster'), adminController.createMovie);

// 3. ดึงรายการหนังทั้งหมด
router.get('/movies', adminController.getAllMovies);

// 4. ลบหนังออกจากระบบ
router.delete('/movies/:id', adminController.deleteMovie);

// 5. อัพเดตข้อมูลหนัง (✅ เพิ่ม upload.single('poster') คั่นกลางเผื่อมีการแก้รูป)
router.put('/movies/:id', upload.single('poster'), adminController.updateMovie);


// --- ส่วนสถิติและรายงาน (Dashboard & Bookings) ---
// 6. ดึงข้อมูลสถิติยอดขาย, ตั๋ว, และจำนวนผู้ใช้ (สำหรับหน้า Dashboard)
router.get('/stats', adminController.getDashboardStats);

// 7. ดึงรายการการจองทั้งหมด (สำหรับหน้า Bookings)
router.get('/bookings', adminController.getAllBookings);


// --- ส่วนจัดการผู้ใช้ (Users) ---
// 8. ดึงรายชื่อลูกค้าทั้งหมด (สำหรับหน้า Customers)
router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getReports);
router.get('/list', adminController.getAllAdmins);
router.post('/add', adminController.addAdmin);
router.post('/promote', adminController.promoteAdmin);

// 9. ลบ Admin
router.delete('/delete/:id', adminController.deleteAdmin);

module.exports = router;