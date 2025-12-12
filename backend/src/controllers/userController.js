const axios = require('axios');
const userService = require('../services/userService');
const User = require('../models/userModel'); // 💡 ใช้ตัวแปรนี้แทน require() ในฟังก์ชัน
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

        // 1. Validate ข้อมูลเบื้องต้น
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // 2. เช็คก่อนว่ามีอีเมลนี้ในระบบหรือยัง (กัน User รอเก้อ)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
        }

        // 3. สร้าง JWT Token โดย "ยัด" ข้อมูล User เข้าไปข้างใน (Stateless)
        // หมายเหตุ: ข้อมูลนี้จะลอยอยู่ใน Token จนกว่า User จะกดยืนยัน
        // เราตั้งเวลาหมดอายุไว้ 30 นาที (15-30 นาที กำลังดี)
        const verificationToken = jwt.sign(
            { name, email, phone, password },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        // 4. สร้าง Link สำหรับยืนยัน (ชี้ไปที่ Frontend หน้าใหม่ที่เราต้องทำ)
        // เช่น http://localhost:3000/verify-email?token=...
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

        // 5. ส่งอีเมล
        const message = `
            <h1>ยืนยันการสมัครสมาชิก</h1>
            <p>กรุณากดที่ลิงก์ด้านล่างเพื่อยืนยันตัวตนและเปิดใช้งานบัญชี (ลิงก์มีอายุ 30 นาที):</p>
            <a href="${verificationUrl}" clicktracking=off>ยืนยันอีเมล</a>
        `;

        await sendEmail({
            to: email,
            subject: 'ยืนยันอีเมลเพื่อสมัครสมาชิก',
            html: message
        });

        // 6. ตอบกลับ Frontend (ยังไม่ Create User จริง)
        res.status(200).json({
            message: `ส่งอีเมลยืนยันไปที่ ${email} แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        console.log("Token received:", token); 

        if (!token) return res.status(400).json({ message: "ไม่พบ Token" });

        // 1. แกะ Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { name, email, phone, password } = decoded;

        // 2. เช็คว่ามี User อยู่แล้วหรือยัง (Check ซ้ำอีกที)
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            // 🔥 ถ้ามีอยู่แล้ว ให้ถือว่ายืนยันสำเร็จไปเลย หรือบอกว่าเคยยืนยันแล้ว
            return res.status(200).json({ message: "บัญชีนี้ถูกยืนยันและสร้างไปแล้ว สามารถ Login ได้เลย" });
        }

        // 3. สร้าง User ใหม่
        await User.create({ name, email, phone, password });

        res.status(201).json({ message: "ยืนยันตัวตนสำเร็จ! บัญชีถูกสร้างเรียบร้อยแล้ว" });

    } catch (error) {
        console.error("Error Detail:", error);

        // 🔥 ดัก Error E11000 (Duplicate Key) เผื่อหลุดมาถึงตรงนี้
        if (error.code === 11000) {
             return res.status(200).json({ message: "บัญชีนี้มีอยู่ในระบบแล้ว (อาจจะยืนยันไปแล้ว) เข้าสู่ระบบได้เลย" });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "ลิงก์ยืนยันหมดอายุแล้ว กรุณาสมัครใหม่" });
        }
        
        res.status(400).json({ message: "ลิงก์ยืนยันไม่ถูกต้อง" });
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