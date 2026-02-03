const { chatWithAI } = require("../services/aiService");
const ChatHistory = require("../models/ChatHistory");
const { getToolsForUser } = require("../config/toolPermissions");
const saveLog = require('../utils/logger'); // ✅ นำเข้า logger มาใช้งาน

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
    const user = req.user; // ในนี้มี user.role แล้ว (จาก middleware auth)

    // 🛡️ SECURITY STEP: ดึงรายชื่อ Tools ที่คนนี้มีสิทธิ์ใช้
    const allowedTools = getToolsForUser(user.role);

    console.log(`👤 User: ${user.name} (${user.role}) is chatting.`);
    console.log(`🛠️ Allowed Tools: ${allowedTools.join(", ")}`);

    // A. ส่งให้ AI คิด (โดยส่ง allowedTools ไปกำกับด้วย)
    const botReply = await chatWithAI(user, message, image, allowedTools);

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
        history = await ChatHistory.create({
            user: user._id,
            messages: [userMsg, botMsg]
        });
    } else {
        history.messages.push(userMsg, botMsg);
        await history.save();
    }

    // ✅ STEP C.5: บันทึก Log เมื่อ AI มีการโต้ตอบ
    await saveLog({
        req: { user: { email: 'AI_Assistant', role: 'ai' } }, // ระบุว่าเป็น AI
        action: 'create',
        table: 'ChatHistory',
        targetId: history._id,
        newVal: { 
            user: user.email, 
            question: message?.substring(0, 50) + (message?.length > 50 ? "..." : "") 
        },
        note: `AI ตอบกลับผู้ใช้ ${user.email}`
    });

    // D. ส่งคำตอบกลับ
    res.json({
      success: true,
      reply: botReply,
      history: history.messages
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chat Error" });
  }
};

// 3. ล้างประวัติ (DELETE)
exports.clearHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await ChatHistory.findOneAndDelete({ user: userId });

        if (result) {
            // ✅ บันทึก Log เมื่อมีการล้างประวัติแชท
            await saveLog({
                req,
                action: 'delete',
                table: 'ChatHistory',
                targetId: result._id,
                note: `ผู้ใช้ ${req.user.email} ทำการล้างประวัติการแชทกับ AI`
            });
        }

        res.json({ success: true, message: "History cleared" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history" });
    }
};