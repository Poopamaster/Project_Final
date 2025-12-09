const User = require('../models/userModel');

// ดึงข้อมูล User ทั้งหมด
exports.getAllUsers = async () => {
    return await User.find().select('-password'); // ไม่ส่ง password กลับไปเพื่อความปลอดภัย
};

// ดึงข้อมูล User ตาม ID
exports.getUserById = async (id) => {
    return await User.findById(id).select('-password');
};

// สร้าง User ใหม่ (Register)
exports.createUser = async (userData) => {
    const user = new User(userData);
    return await user.save();
};

// อัปเดตข้อมูล User
exports.updateUser = async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { 
        new: true, // คืนค่าข้อมูลใหม่หลัง update
        runValidators: true // ตรวจสอบเงื่อนไขใน Model
    }).select('-password');
};

// ลบ User
exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};