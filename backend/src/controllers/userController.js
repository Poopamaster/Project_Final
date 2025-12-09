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