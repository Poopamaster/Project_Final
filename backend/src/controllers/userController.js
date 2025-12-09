const userService = require('../services/userService');
const axios = require('axios');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

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

        const foundUser = await require('../models/userModel').findOne({ email });

        if (!foundUser) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        const isMatch = await foundUser.matchPassword(password); // ใช้ method ที่เพิ่มใน Model

        if (!isMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const token = generateToken(foundUser._id);
        
        const userResponse = foundUser.toObject();
        delete userResponse.password;

        res.status(200).json({ 
            message: "Login Successful", 
            user: userResponse,
            token: token // <--- ส่ง Token กลับไปให้ Frontend เก็บ
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    // ใส่ Log ตรงนี้เพื่อยืนยันว่าเข้าฟังก์ชันได้
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
                phone: 'N/A', // ต้องระบุตาม Schema แม้จะไม่มีข้อมูลจาก Google
                password: 'GOOGLE_AUTH_USER', // รหัสผ่านปลอมที่รู้กันว่ามาจาก Google
            });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json({ 
            message: "Google Login Successful", 
            user: userResponse 
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