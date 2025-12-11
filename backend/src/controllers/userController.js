const axios = require('axios');
const userService = require('../services/userService');
const User = require('../models/userModel'); // 💡 ใช้ตัวแปรนี้แทน require() ในฟังก์ชัน
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// --- CRUD Operations ---

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
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน กรุณาใส่ ชื่อ, อีเมล, เบอร์โทรศัพท์ และรหัสผ่าน" });
        }

        const newUser = await require('../services/userService').createUser(req.body);

        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: error.message });
    }
};

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

// --- Authentication ---

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ แก้ไข: ใช้ User ที่ Import ไว้ด้านบนแล้ว
        const foundUser = await User.findOne({ email });

        if (!foundUser) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        const isMatch = await foundUser.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const token = generateToken(foundUser._id);

        const userResponse = foundUser.toObject();
        delete userResponse.password;

        res.status(200).json({
            message: "Login Successful",
            user: userResponse,
            token: token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    console.log('*** ENTERING GOOGLE LOGIN FUNCTION ***');

    try {
        const { accessToken } = req.body;

        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const googleUser = googleResponse.data;

        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            console.log(`User not found. Creating new user: ${googleUser.email}`);

            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                phone: 'N/A',
                password: 'GOOGLE_AUTH_USER',
            });
        }

        // 🔥 เพิ่ม 2 บรรทัดนี้ครับ !!! (สร้าง Token ของระบบเรา)
        const token = generateToken(user._id);

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({
            message: "Google Login Successful",
            user: userResponse,
            token: token // 🔥 และส่ง Token กลับไปให้ Frontend ด้วย
        });

    } catch (error) {
        console.error("DEBUG: Google Login Failed!");

        if (error.response) {
            console.error("Status Code:", error.response.status);
            console.error("Google Error Data:", error.response.data);
            return res.status(400).json({ message: "Google API Access Failed", details: error.response.data });
        } else {
            console.error("General/DB Error:", error.message);
            return res.status(500).json({ message: "Internal Server Error during Google Login", details: error.message });
        }
    }
};

// --- Password Reset ---

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    let user;

    try {
        user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                message: 'ถ้ามีอีเมลนี้ในระบบ ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว'
            });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `
            <h1>คุณร้องขอการรีเซ็ตรหัสผ่าน</h1>
            <p>กรุณาคลิกที่ลิงก์นี้เพื่อรีเซ็ตรหัสผ่าน (ลิงก์จะหมดอายุใน 10 นาที):</p>
            <a href="${resetURL}" clicktracking=off>${resetURL}</a>
        `;

        await sendEmail({
            to: user.email,
            subject: 'รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ',
            html: message,
        });

        res.status(200).json({
            message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว'
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);

        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }

        res.status(500).json({ message: "ไม่สามารถส่งอีเมลได้: " + error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const resetToken = req.params.token;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "กรุณาใส่รหัสผ่านใหม่" });
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือไม่หมดอายุแล้ว'
            });
        }

        user.password = password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            message: 'รหัสผ่านถูกรีเซ็ตสำเร็จแล้ว'
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" });
    }
};