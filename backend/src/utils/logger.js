// backend/utils/logger.js
const Log = require('../models/logModel');

const saveLog = async ({ req, action, table, targetId, oldVal = null, newVal = null, note = "" }) => {
    try {
        // ✅ ปรับให้รองรับกรณี req.user ไม่มีข้อมูล เพื่อไม่ให้บันทึกพัง
        const logData = {
            user_email: req.user?.email || "unknown@mcp.com", 
            role: req.user?.role || "guest",                         
            action: action,                                       
            table_name: table,                                    
            target_id: String(targetId), // มั่นใจว่าเป็น String
            old_value: oldVal,                                    
            new_value: newVal,                                    
            note: note                                            
        };
        
        console.log("💾 กำลังพยายามบันทึก Log:", action, table);
        const result = await Log.create(logData);
        console.log("✅ บันทึก Log สำเร็จ ID:", result._id);
        
    } catch (error) {
        console.error("❌ บันทึก Log ล้มเหลว:", error.message);
    }
};

module.exports = saveLog;