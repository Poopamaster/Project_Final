// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // ⚠️ ต้องมั่นใจว่าคุณมี User Model แล้ว

exports.authenticate = async (req, res, next) => {
  let token;

  // 1. เช็คว่ามี Token ส่งมาใน Header ไหม (Format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // ตัดคำว่า "Bearer " ออก เอาแค่ตัว Token
      token = req.headers.authorization.split(" ")[1];

      // 2. ตรวจสอบความถูกต้องของ Token (Verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. ค้นหา User ใน Database ตาม ID ที่ได้จาก Token
      // (เพื่อเอา Role ล่าสุดมาใช้)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
         return res.status(401).json({ error: "User not found with this token" });
      }

      // 4. อนุญาตให้ไปต่อ (ไปหา Controller)
      next();

    } catch (error) {
      console.error("Auth Error:", error);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};