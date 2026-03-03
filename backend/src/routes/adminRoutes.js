const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');     
const fs = require('fs'); 
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// ==========================================
// 🖼️ 1. สำหรับอัปโหลดรูปภาพ (บันทึกลง Disk)
// ==========================================
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
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
const uploadImage = multer({ storage: imageStorage });

// ==========================================
// 📊 2. สำหรับ Excel (เก็บใน RAM ชั่วคราว - ปลอดภัยกว่า)
// ==========================================
const excelUpload = multer({ storage: multer.memoryStorage() });

// ==========================================
// 🚀 Routes (Global Middleware)
// ==========================================

router.use(authenticate); // ทุก Route ด้านล่างต้อง Login
router.use(isAdmin);      // ทุก Route ด้านล่างต้องเป็น Admin

// --- จัดการภาพยนตร์ ---
router.get('/search-tmdb', adminController.searchTMDB);
router.post('/movies/add-tmdb', adminController.addMovieFromTMDB);
router.post('/movies', uploadImage.single('poster'), adminController.createMovie);
router.get('/movies', adminController.getAllMovies);
router.delete('/movies/:id', adminController.deleteMovie);
router.put('/movies/:id', uploadImage.single('poster'), adminController.updateMovie);

// --- ส่วนสถิติและรายงาน ---
router.get('/stats', adminController.getDashboardStats);
router.get('/bookings', adminController.getAllBookings);
router.get('/reports', adminController.getReports);
router.get('/logs', adminController.getSystemLogs);

// --- ส่วนจัดการผู้ใช้และ Admin ---
router.get('/users', adminController.getAllUsers);
router.get('/list', adminController.getAllAdmins);
router.post('/add', adminController.addAdmin);
router.post('/promote', adminController.promoteAdmin);
router.delete('/delete/:id', adminController.deleteAdmin);

// --- 🌟 ใหม่: นำเข้า Excel 🌟 ---
router.post('/import-excel', 
    excelUpload.single('file'), 
    adminController.importMoviesFromExcel
);

module.exports = router;