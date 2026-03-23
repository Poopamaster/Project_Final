const systemLog = require('../utils/logger');

module.exports = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        res.on('finish', () => {
            // เช็คสถานะ 200-299
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // ดึงชื่อ Table ให้ปลอดภัยขึ้น
                const urlParts = req.originalUrl.split('/');
                const tableName = urlParts[2] || 'system';

                systemLog({
                    level: 'INFO',
                    // ใช้ ?. เพื่อกัน Error กรณี req.user เป็น null
                    actor: req.user || { email: 'guest', role: 'guest' }, 
                    context: {
                        action: req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : 'delete',
                        table: tableName,
                        target_id: req.params.id || 'N/A'
                    },
                    note: `API Request: ${req.originalUrl}`,
                    req: req
                }).catch(err => console.error("Logger Background Error:", err)); 
                // ^ ใส่ .catch เพื่อไม่ให้ Error ใน Logger ไปขัดขวาง Main Thread
            }
        });
    }
    next();
};