const { chatWithAI } = require("../services/aiService");
const ChatHistory = require("../models/ChatHistory");

exports.getHistory = async (req, res) => {
  try {
    let history = await ChatHistory.findOne({ user: req.user._id });
    
    // ถ้าไม่เคยมีประวัติ ให้ส่ง Array ว่าง (หรือข้อความต้อนรับ) กลับไป
    if (!history) {
      return res.json([]); 
    }
    
    res.json(history.messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// 2. คุยกับ AI และบันทึก (POST)
exports.chat = async (req, res) => {
  try {
    const { message, image } = req.body;
    const user = req.user;

    // A. ส่งให้ AI คิด
    const botReply = await chatWithAI(user, message, image);

    // B. เตรียมข้อความ User และ Bot
    const userMsg = {
        id: Date.now(),
        sender: 'user',
        text: message || '',
        image: image || null
    };

    const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReply
    };

    // C. บันทึกลง MongoDB
    let history = await ChatHistory.findOne({ user: user._id });

    if (!history) {
        // ถ้ายังไม่เคยคุย ให้สร้างใหม่
        history = await ChatHistory.create({
            user: user._id,
            messages: [userMsg, botMsg]
        });
    } else {
        // ถ้ามีอยู่แล้ว ให้ Push ต่อท้าย
        history.messages.push(userMsg, botMsg);
        await history.save();
    }

    // D. ส่งคำตอบกลับไปหา Frontend
    res.json({
      success: true,
      reply: botReply,
      history: history.messages // ส่งประวัติล่าสุดกลับไปเลยก็ได้
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chat Error" });
  }
};

// 3. ล้างประวัติ (DELETE)
exports.clearHistory = async (req, res) => {
    try {
        await ChatHistory.findOneAndDelete({ user: req.user._id });
        res.json({ success: true, message: "History cleared" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history" });
    }
};