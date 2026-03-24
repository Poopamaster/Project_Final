const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

// --- Helper Functions ---
// (อาจจะเอา generateToken มาเขียนในนี้หรือ import มาก็ได้ครับ แต่ผมดึง logic มาไว้รวมกันเพื่อให้เห็นภาพ)

exports.getAllUsers = async () => {
    return await User.find().select('-password');
};

exports.getUserById = async (id) => {
    const user = await User.findById(id).select('-password');
    if (!user) throw new Error("User not found");
    return user;
};

// 1. Logic ขอสมัครสมาชิก (ส่งเมลยืนยันก่อน ยังไม่ลง DB)
exports.requestRegistration = async (userData) => {
    const { name, email, phone, password } = userData;

    // Validate
    if (!name || !email || !phone || !password) {
        throw new Error("ข้อมูลไม่ครบถ้วน");
    }

    // Check Duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
    }

    // Generate Verification Token (Stateless)
    const verificationToken = jwt.sign(
        { name, email, phone, password },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
    );

    // Create Link
    // เพิ่มบรรทัดนี้เพื่อตั้งค่าสำรองให้วิ่งไปที่พอร์ต 5173 ของ Vite เสมอหากตั้ง .env ผิด
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    
    // Send Email
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

    return { message: `ส่งอีเมลยืนยันไปที่ ${email} แล้ว` };
};

// 2. Logic ยืนยันอีเมล (แกะ Token -> ลง DB จริง)
exports.verifyEmailAndCreateUser = async (token) => {
    // 🔔 1. Log เมื่อมี Request เข้ามาถึงฟังก์ชันนี้
    console.log("----------------------------------------");
    console.log("📥 [Verify Email]: มีคนกดลิงก์ยืนยันจากอีเมล!");
    
    if (!token) {
        console.log("❌ [Verify Email Error]: ไม่พบ Token ใน Request");
        throw new Error("ไม่พบ Token");
    }

    try {
        // Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { name, email, phone, password } = decoded;

        // 🔔 2. Log ว่าเป็นใครที่กดลิงก์
        console.log(`👤 [Verify Email]: Token ถูกต้องสำหรับผู้ใช้: ${email}`);

        // Double Check Duplicate
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log(`⚠️ [Verify Email Warning]: บัญชี ${email} เคยยืนยันไปแล้ว`);
            return { message: "บัญชีนี้ถูกยืนยันและสร้างไปแล้ว สามารถ Login ได้เลย" };
        }

        // Create Real User in DB
        const newUser = await User.create({ name, email, phone, password });

        // 🔔 3. Log เมื่อสร้างบัญชีสำเร็จ
        console.log(`✅ [Verify Email Success]: สร้างบัญชีใหม่ให้ ${email} สำเร็จเรียบร้อย!`);
        console.log("----------------------------------------");

        return { message: "ยืนยันตัวตนสำเร็จ! บัญชีถูกสร้างเรียบร้อยแล้ว", user: newUser };

    } catch (error) {
        // 🔔 4. Log เมื่อ Token มีปัญหา (เช่น หมดอายุ หรือโดนแก้ไข)
        console.log(`❌ [Verify Email Error]: การตรวจสอบ Token ล้มเหลว - ${error.message}`);
        console.log("----------------------------------------");
        throw error;
    }
};

// 3. Logic Login
exports.loginUser = async (email, password) => {
    const foundUser = await User.findOne({ email });
    if (!foundUser) throw new Error("ไม่พบผู้ใช้งานนี้ในระบบ");

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) throw new Error("รหัสผ่านไม่ถูกต้อง");

    const token = generateToken(foundUser._id);
    
    // Convert to object to delete password
    const userResponse = foundUser.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
};

// 4. Logic Google Login
exports.googleLogin = async (accessToken) => {
    // Call Google API
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const googleUser = googleResponse.data;

    // Check DB
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
        console.log(`Creating new Google user: ${googleUser.email}`);
        user = await User.create({
            name: googleUser.name,
            email: googleUser.email,
            phone: 'N/A',
            password: 'GOOGLE_AUTH_USER',
        });
    }

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
};

// 5. Logic Forgot Password
exports.forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        // Return dummy success to prevent email enumeration attacks (Optional)
        return { message: 'ถ้ามีอีเมลนี้ในระบบ ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว' };
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
        <h1>คุณร้องขอการรีเซ็ตรหัสผ่าน</h1>
        <p>กรุณาคลิกที่ลิงก์นี้เพื่อรีเซ็ตรหัสผ่าน (ลิงก์จะหมดอายุใน 10 นาที):</p>
        <a href="${resetURL}" clicktracking=off>${resetURL}</a>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ',
            html: message,
        });
        return { message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว' };
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        throw new Error("ไม่สามารถส่งอีเมลได้");
    }
};

// 6. Logic Reset Password
exports.resetPassword = async (resetToken, newPassword) => {
    if (!newPassword) throw new Error("กรุณาใส่รหัสผ่านใหม่");

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) throw new Error('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือไม่หมดอายุแล้ว');

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'รหัสผ่านถูกรีเซ็ตสำเร็จแล้ว' };
};

exports.updateUser = async (id, updateData) => {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    }).select('-password');
    
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
};

exports.deleteUser = async (id) => {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) throw new Error("User not found");
    return deletedUser;
};