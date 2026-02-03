const userService = require('../services/userService');
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

// --- CRUD & Actions ---

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
        
        // ✅ บันทึก Log เมื่อผู้ใช้ยืนยันตัวตนและสร้างบัญชีสำเร็จ
        if (result.user) {
            await saveLog({
                req: { user: result.user }, 
                action: 'create',
                table: 'User',
                targetId: result.user._id,
                newVal: { email: result.user.email, name: result.user.name },
                note: `ผู้ใช้ใหม่สมัครสมาชิกและยืนยันอีเมลสำเร็จ: ${result.user.email}`
            });
        }

        const statusCode = result.message.includes("สร้างเรียบร้อย") ? 201 : 200;
        res.status(statusCode).json(result);

    } catch (error) {
        console.error("Verify Error:", error);
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

        // ✅ บันทึก Log เมื่อมีการ Login เข้าสู่ระบบ
        await saveLog({
            req: { user: result.user }, 
            action: 'login', // กำหนด action พิเศษสำหรับ Login
            table: 'User',
            targetId: result.user._id,
            note: `ผู้ใช้ ${email} เข้าสู่ระบบสำเร็จ`
        });

        res.status(200).json({
            message: "Login Successful",
            ...result
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;
        const result = await userService.googleLogin(accessToken);

        // ✅ บันทึก Log เมื่อ Login ผ่าน Google
        await saveLog({
            req: { user: result.user },
            action: 'login',
            table: 'User',
            targetId: result.user._id,
            note: `ผู้ใช้ ${result.user.email} เข้าสู่ระบบผ่าน Google`
        });

        res.status(200).json({
            message: "Google Login Successful",
            ...result
        });
    } catch (error) {
        console.error("Google Login Error:", error.response ? error.response.data : error.message);
        res.status(400).json({ message: "Google Login Failed", details: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await userService.forgotPassword(email);

        // ✅ บันทึก Log เมื่อมีการขอรีเซ็ตรหัสผ่าน
        await saveLog({
            req: { user: { email: email, role: 'user' } },
            action: 'update',
            table: 'User',
            targetId: 'reset_token',
            note: `มีการส่งอีเมลขอรีเซ็ตรหัสผ่านไปยัง: ${email}`
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const result = await userService.resetPassword(req.params.token, password);

        // ✅ บันทึก Log เมื่อเปลี่ยนรหัสผ่านสำเร็จ
        await saveLog({
            req: { user: result.user },
            action: 'update',
            table: 'User',
            targetId: result.user._id,
            note: `ผู้ใช้ ${result.user.email} ทำการเปลี่ยนรหัสผ่านใหม่เรียบร้อย`
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const oldData = await userService.getUserById(req.params.id);
        const updatedUser = await userService.updateUser(req.params.id, req.body);

        // ✅ บันทึก Log เมื่อมีการอัปเดตข้อมูลผู้ใช้
        await saveLog({
            req,
            action: 'update',
            table: 'User',
            targetId: req.params.id,
            oldVal: { name: oldData.name, role: oldData.role },
            newVal: { name: updatedUser.name, role: updatedUser.role },
            note: `แก้ไขข้อมูลผู้ใช้: ${updatedUser.email}`
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const target = await userService.getUserById(req.params.id);
        await userService.deleteUser(req.params.id);

        // ✅ บันทึก Log เมื่อมีการลบผู้ใช้
        await saveLog({
            req,
            action: 'delete',
            table: 'User',
            targetId: req.params.id,
            oldVal: { email: target.email, name: target.name },
            note: `ลบผู้ใช้ในระบบ: ${target.email}`
        });

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).json({ message: error.message });
    }
};