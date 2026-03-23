const userService = require('../services/userService');
const systemLog = require('../utils/logger'); // ✅ 1. นำเข้า Logger

// --- CRUD & Actions ---

// ดึงข้อมูลผู้ใช้ (Read-only) - ไม่เก็บ Log เพื่อประหยัดพื้นที่
exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).json({ message: error.message });
    }
};

// Register (Step 1: Send Email)
exports.createUser = async (req, res) => {
    try {
        const result = await userService.requestRegistration(req.body);

        // 📝 บันทึก Log: ร้องขอสมัครสมาชิก
        systemLog({
            level: 'INFO',
            context: { action: 'create', table: 'users' },
            note: `ร้องขอสมัครสมาชิกด้วยอีเมล: ${req.body.email}`,
            req: req
        }).catch(() => {});

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Verify Email (Step 2: Create User)
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const result = await userService.verifyEmailAndCreateUser(token);
        
        const statusCode = result.message.includes("สร้างเรียบร้อย") ? 201 : 200;

        // 📝 บันทึก Log: ยืนยันอีเมลสำเร็จ
        systemLog({
            level: 'INFO',
            context: { action: 'create', table: 'users' },
            note: `ยืนยันอีเมลและสร้างบัญชีสำเร็จ (Token Verify)`,
            req: req
        }).catch(() => {});

        res.status(statusCode).json(result);

    } catch (error) {
        console.error("Verify Error:", error);

        // 📝 บันทึก Log: ยืนยันอีเมลพลาด
        systemLog({
            level: 'WARN', // ใช้ WARN เพราะอาจมีคนพยายามเดา Token
            context: { action: 'create', table: 'users' },
            note: `ยืนยันอีเมลล้มเหลว: ${error.message}`,
            req: req
        }).catch(() => {});

        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "ลิงก์ยืนยันหมดอายุแล้ว กรุณาสมัครใหม่" });
        }
        res.status(400).json({ message: error.message || "ลิงก์ยืนยันไม่ถูกต้อง" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await userService.loginUser(email, password);
        
        // 📝 บันทึก Log: ล็อกอินสำเร็จ
        systemLog({
            level: 'INFO',
            // ถ้า result มีข้อมูล user ส่งกลับมา สามารถใส่เป็น actor ได้ เช่น actor: result.user
            context: { action: 'login', table: 'users' },
            note: `เข้าสู่ระบบสำเร็จ: ${email}`,
            req: req
        }).catch(() => {});

        res.status(200).json({
            message: "Login Successful",
            ...result
        });
    } catch (error) {
        // 📝 บันทึก Log: ล็อกอินพลาด (สำคัญมาก ป้องกัน Brute Force)
        systemLog({
            level: 'WARN',
            context: { action: 'login', table: 'users' },
            note: `เข้าสู่ระบบล้มเหลว (${req.body.email}): ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(401).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;
        const result = await userService.googleLogin(accessToken);
        
        systemLog({
            level: 'INFO',
            context: { action: 'login', table: 'users' },
            note: `เข้าสู่ระบบด้วย Google สำเร็จ`,
            req: req
        }).catch(() => {});

        res.status(200).json({
            message: "Google Login Successful",
            ...result
        });
    } catch (error) {
        systemLog({
            level: 'WARN',
            context: { action: 'login', table: 'users' },
            note: `เข้าสู่ระบบด้วย Google ล้มเหลว: ${error.message}`,
            req: req
        }).catch(() => {});

        console.error("Google Login Error:", error.response ? error.response.data : error.message);
        res.status(400).json({ message: "Google Login Failed", details: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await userService.forgotPassword(email);
        
        systemLog({
            level: 'INFO',
            context: { action: 'update', table: 'users' },
            note: `ร้องขอรีเซ็ตรหัสผ่าน: ${email}`,
            req: req
        }).catch(() => {});

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const result = await userService.resetPassword(req.params.token, password);
        
        systemLog({
            level: 'INFO',
            context: { action: 'update', table: 'users' },
            note: `เปลี่ยนรหัสผ่านสำเร็จ (ผ่านลิงก์รีเซ็ต)`,
            req: req
        }).catch(() => {});

        res.status(200).json(result);
    } catch (error) {
        systemLog({
            level: 'WARN',
            context: { action: 'update', table: 'users' },
            note: `เปลี่ยนรหัสผ่านล้มเหลว: ${error.message}`,
            req: req
        }).catch(() => {});

        res.status(400).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        
        // 📝 บันทึก Log: การแก้ไขข้อมูลผู้ใช้ (อันนี้มี req.user แน่นอน เพราะต้อง Login ก่อนถึงจะทำได้)
        systemLog({
            level: 'INFO',
            actor: req.user,
            context: { action: 'update', table: 'users', target_id: req.params.id },
            note: `แก้ไขข้อมูลผู้ใช้ ID: ${req.params.id}`,
            req: req
        }).catch(() => {});

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        
        // 📝 บันทึก Log: การลบผู้ใช้ (ต้องใช้ WARN/ERROR เพื่อให้สะดุดตา)
        systemLog({
            level: 'WARN',
            actor: req.user,
            context: { action: 'delete', table: 'users', target_id: req.params.id },
            note: `ลบผู้ใช้ ID: ${req.params.id} ออกจากระบบ`,
            req: req
        }).catch(() => {});

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).json({ message: error.message });
    }
};