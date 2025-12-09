const userService = require('../services/userService');

// GET: /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET: /api/users/:id
exports.getUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST: /api/users
exports.createUser = async (req, res) => {
    try {
        // ในระบบจริงต้องมีการ Hash Password ตรงนี้ก่อนส่งไป Service
        const newUser = await userService.createUser(req.body);
        
        // ลบ password ออกจาก response เพื่อความปลอดภัย
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        // เช็คว่า Error เพราะ Email ซ้ำหรือไม่
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(400).json({ message: error.message });
    }
};

// PUT: /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE: /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. ค้นหา User จาก Email
        const user = await require('../services/userService').getAllUsers(); 
        // *หมายเหตุ: เพื่อประสิทธิภาพที่ดี ควรสร้าง func getUserOne ใน service แต่เพื่อความง่าย เราจะใช้ logic นี้ก่อน
        const foundUser = await require('../models/userModel').findOne({ email });

        if (!foundUser) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        // 2. ตรวจสอบรหัสผ่าน (ในระบบจริงต้องใช้ bcrypt hash แต่ตอนนี้เทียบ string ตรงๆ ก่อน)
        if (foundUser.password !== password) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        // 3. Login สำเร็จ (ส่งข้อมูล User กลับไป ยกเว้น password)
        const userResponse = foundUser.toObject();
        delete userResponse.password;

        res.status(200).json({ 
            message: "Login Successful", 
            user: userResponse 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};