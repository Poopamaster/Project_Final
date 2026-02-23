const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ เพิ่ม Multer
const path = require('path');     // ✅ เพิ่ม Path
const fs = require('fs'); // 🌟 1. เพิ่ม fs (File System) เข้ามา
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

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

router.use(authenticate);
router.use(isAdmin);

router.get('/search-tmdb', adminController.searchTMDB);
router.post('/movies/add-tmdb', adminController.addMovieFromTMDB);
router.post('/movies', upload.single('poster'), adminController.createMovie);
router.get('/movies', adminController.getAllMovies);
router.delete('/movies/:id', adminController.deleteMovie);
router.put('/movies/:id', upload.single('poster'), adminController.updateMovie);

// --- ส่วนสถิติและรายงาน ---
router.get('/stats', adminController.getDashboardStats);
router.get('/bookings', adminController.getAllBookings);

// --- ส่วนจัดการผู้ใช้และ Admin ---
router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getReports);
router.get('/list', adminController.getAllAdmins);
router.post('/add', adminController.addAdmin);
router.post('/promote', adminController.promoteAdmin);
router.delete('/delete/:id', adminController.deleteAdmin);
router.get('/logs', authenticate, isAdmin, adminController.getSystemLogs);

module.exports = router;