// middleware/logger.js
const systemLog = require('../utils/logger');

module.exports = (req, res, next) => {
    // เก็บ Log ลง Console ปกติ
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // ถ้ามีการแก้ไขข้อมูล (ไม่ใช่ GET) ให้บันทึกลง System Log ด้วย
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        // รอให้ Request ทำงานเสร็จก่อนค่อยดึงข้อมูลมาลง Log (ใช้ event finish)
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                systemLog({
                    level: 'INFO',
                    actor: req.user, // ได้มาจาก authenticate middleware
                    context: {
                        action: req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : 'delete',
                        table: req.originalUrl.split('/')[2], // ดึงชื่อ table จาก URL เช่น /api/movies
                        target_id: req.params.id || 'N/A'
                    },
                    note: `API Request: ${req.originalUrl}`,
                    req: req
                });
            }
        });
    }
    next();
};