const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user_email: { type: String, required: true }, // 1. ใครทำ (email)
    role: { type: String, required: true },       // 2. role (admin / user / ai)
    action: { type: String, required: true },     // 3. ทำอะไร (create, update, login, etc.)
    table_name: { type: String, required: true }, // 4. ทำกับ table ไหน (Booking, Movie)
    target_id: { type: String },                  // 5. ID ของข้อมูลนั้นๆ
    old_value: { type: Object, default: null },   // 6. ค่าก่อนแก้ไข (สำหรับ Highlight)
    new_value: { type: Object, default: null },   // 6. ค่าหลังแก้ไข (สำหรับ Highlight)
    timestamp: { type: Date, default: Date.now }, // 7. วัน-เวลา แบบละเอียด
    note: { type: String, default: "" }           // 8. หมายเหตุ (เช่น AI ยกเลิกตั๋ว)
}, {
    timestamps: false 
});

module.exports = mongoose.model('Log', logSchema);