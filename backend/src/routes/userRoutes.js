const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Import Middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// --- 🌐 1. Public Routes (ไม่ต้อง Login) ---
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.post('/forgot-password', userController.forgotPassword);
router.put('/reset-password/:token', userController.resetPassword);
router.post('/', userController.createUser); // Register step 1
router.post('/verify-email', userController.verifyEmail); // Register step 2

// --- 👤 2. Protected Routes (ต้อง Login) ---
// ดูข้อมูลตัวเอง หรือแก้ไขข้อมูลตัวเอง
router.get('/:id', authenticate, userController.getUser);
router.put('/:id', authenticate, userController.updateUser);

// --- 🔐 3. Admin Routes (Admin Only) ---
// ดูรายชื่อผู้ใช้ทั้งหมดในระบบ หรือลบ User
router.get('/', authenticate, isAdmin, userController.getUsers);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;