// backend/src/middleware/errorHandler.js
/**
 * Global Error Handler Middleware
 * ใช้ใน app.js: app.use(errorHandler)  ← ต้องเป็น middleware ตัวสุดท้าย
 *
 * วิธีใช้ใน Controller แทนการ res.status(500).json({ message: error.message }):
 *   catch (error) { next(error); }
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} — ${err.message}`);
    if (isDevelopment) console.error(err.stack);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, errors });
    }

    // Mongoose Duplicate Key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            error: `ข้อมูลซ้ำ: ${field} นี้มีในระบบแล้ว`
        });
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Token ไม่ถูกต้อง' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }

    // Mongoose Cast Error (เช่น ID รูปแบบผิด)
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    // ✅ Production: ไม่เปิดเผย error.message ดิบๆ
    // ✅ Development: แสดง error ตรงๆ เพื่อ debug ได้ง่าย
    res.status(err.status || 500).json({
        success: false,
        error: isDevelopment
            ? err.message
            : 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง'
    });
};

module.exports = errorHandler;