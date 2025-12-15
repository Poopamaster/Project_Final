const userService = require('../services/userService');

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
        // แยก 404 ถ้า error message ตรงกัน (Optional)
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
        
        // เช็ค status ว่าเป็นการสร้างใหม่ (201) หรือมีอยู่แล้ว (200)
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
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const result = await userService.resetPassword(req.params.token, password);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(error.message === "User not found" ? 404 : 500).json({ message: error.message });
    }
};