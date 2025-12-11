const { chatWithAI } = require("../services/aiService");

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    
    // req.user มาจาก Auth Middleware (สำคัญมาก! เพราะ AI ต้องรู้ Role)
    const user = req.user; 

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`💬 User: ${user.email} (Role: ${user.role}) is asking: "${message}"`);

    // ส่งให้ AI Service (ที่ต่อกับ Gemini + MCP ไว้แล้ว)
    const botReply = await chatWithAI(user, message);

    // ส่งคำตอบกลับไปที่ Frontend
    res.json({
      success: true,
      reply: botReply,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};