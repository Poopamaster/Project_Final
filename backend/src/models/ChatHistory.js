// backend/src/models/ChatHistory.js
const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // 1 User มีประวัติได้ 1 ก้อน (หรือจะทำแยก Session ก็ได้)
  },
  messages: [
    {
      id: Number,
      sender: { type: String, enum: ['user', 'bot'] },
      text: String,
      image: String, // เก็บ Base64 (ถ้าไฟล์ใหญ่มากแนะนำใช้ Cloud Storage แทนในอนาคต)
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);