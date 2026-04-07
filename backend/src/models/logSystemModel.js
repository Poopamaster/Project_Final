// models/Logsystem.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], default: 'INFO' },
    actor: {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: String,
        role: String
    },
    context: {
        action: String, // create, update, delete, login
        table: String,  // movies, bookings, users
        target_id: String
    },
    content: {
        user_message: String,
        ai_response: String,
        image_url: String, // กรณีมีการส่งรูปให้ AI วิเคราะห์
        tools_used: [String] // AI เรียกใช้เครื่องมืออะไรไปบ้าง (เช่น search_movies)
    },
    changes: {
        old: Object,
        new: Object
    },
    note: String,
    ip_address: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);