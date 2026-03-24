const { chatWithAI } = require("../services/aiService");
const ChatHistory = require("../models/ChatHistory");
const { getToolsForUser } = require("../config/toolPermissions");
const systemLog = require('../utils/logger'); // ✅ นำเข้า Logger

// 1. ดึงประวัติ (GET) - ไม่ต้องใส่ Log เพื่อป้องกัน Database บวมจากการแค่เปิดหน้าแชท
exports.getHistory = async (req, res) => {
  try {
    let history = await ChatHistory.findOne({ user: req.user._id });
    if (!history) return res.json([]);
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

    const allowedTools = getToolsForUser(user.role);

    console.log(`👤 User: ${user.name} (${user.role}) is chatting.`);
    console.log(`🛠️ Allowed Tools: ${allowedTools.join(", ")}`);

    let historyDoc = await ChatHistory.findOne({ user: user._id });
    const previousMessages = historyDoc ? historyDoc.messages : [];

    // A. ส่งให้ AI คิด
    const botReply = await chatWithAI(user, message, image, allowedTools, previousMessages);

    // 📝 เก็บ Log System
    systemLog({
      level: 'INFO',
      actor: user,
      context: { action: 'chat', table: 'chathistories', target_id: user._id },
      note: 'User สนทนากับ AI (Gemini)',
      content: {
        user_message: message,
        ai_response: botReply,
        image_url: image || null,
        tools_used: allowedTools
      },
      req: req
    }).catch(err => console.error("Chat Log Error:", err));

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

    // C. บันทึกลง MongoDB (แก้ไข Race Condition & E11000)
    const updatedHistory = await ChatHistory.findOneAndUpdate(
      { user: user._id },
      { $push: { messages: { $each: [userMsg, botMsg] } } },
      { returnDocument: 'after', upsert: true }
    );

    // D. ส่งคำตอบกลับ
    res.json({
      success: true,
      reply: botReply,
      history: updatedHistory.messages
    });

  } catch (error) {
    // 📝 Log กรณี AI พัง
    systemLog({
      level: 'ERROR',
      actor: req.user,
      context: { action: 'chat_error', table: 'chathistories' },
      note: `AI Chat Error: ${error.message}`,
      req: req
    }).catch(() => { });

    console.error(error);
    res.status(500).json({ error: "Chat Error" });
  }
};

// 3. ล้างประวัติ (DELETE)
exports.clearHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ user: req.user._id });

    // 📝 บันทึก Log: ผู้ใช้กดลบประวัติแชทตัวเอง
    systemLog({
      level: 'WARN', // ใช้ WARN ให้เห็นชัดเจนว่าเป็น Action เชิงทำลายข้อมูล
      actor: req.user,
      context: { action: 'delete', table: 'chathistories', target_id: req.user._id },
      note: 'ผู้ใช้ล้างประวัติการสนทนากับ AI ทั้งหมด',
      req: req
    }).catch(err => console.error("Clear Chat Log Error:", err));

    res.json({ success: true, message: "History cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear history" });
  }
};