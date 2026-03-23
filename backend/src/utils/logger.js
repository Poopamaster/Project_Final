const Log = require('../models/logSystemModel');

// 1. ต้องประกาศชื่อฟังก์ชันให้ตรงกับตอน Export ด้านล่าง
const systemLog = async ({ level, actor, context, content, changes, note, req }) => {
    try {
        // สร้างข้อมูล Log object
        const logData = {
            level: level || 'INFO',
            actor: {
                user_id: actor?._id || null,
                email: actor?.email || 'system',
                role: actor?.role || 'system'
            },
            context: context || {},
            content: content || {},
            changes: changes || {},
            note: note || '',
            ip_address: req?.ip || req?.headers['x-forwarded-for'] || '127.0.0.1',
            timestamp: new Date()
        };

        // 2. บันทึกลง MongoDB
        await Log.create(logData);
        
    } catch (error) {
        // ใช้ console.error เพื่อดูว่าทำไม Log ถึงบันทึกไม่ได้ (แต่ไม่ทำให้ App ล่ม)
        console.error("❌ Failed to save system log:", error.message);
    }
};

// 3. Export ชื่อให้ตรงกับที่ประกาศไว้ข้างบน
module.exports = systemLog;