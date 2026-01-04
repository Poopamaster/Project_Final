// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { client } = require("./mcpClient");
const { getSystemPrompt } = require("../utils/promptGenerator");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🧠 1. ตัวแปรเก็บความจำ (ประกาศไว้นอกสุด ห้ามลบ)
// ข้อควรระวัง: ถ้า Restart Server ตัวแปรนี้จะหาย (ถ้าจะเอาถาวรต้องใช้ Database)
const chatSessions = {}; 

function fileToGenerativePart(base64String) {
  if (!base64String) return null;
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { inlineData: { mimeType: "image/jpeg", data: base64String } };
  }
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
}

// ฟังก์ชันจัดหน้า (Formatter)
function forceFormatOutput(rawData) {
    try {
        const data = JSON.parse(rawData);
        // ถ้าเป็น Array รายการหนัง
        if (Array.isArray(data)) {
            const list = data.map((m, index) => {
                const title = m.Title || m.title_th + ` (${m.title_en})`; 
                const genre = m.Genre || m.genre || "-";
                const date = m.ReleaseDate || m.ShowingDate || m.start_date || "-";
                return `### ${index + 1}. 🎬 ${title}\n   - 🎭 แนว: ${genre}\n   - 📅 ฉาย: ${date}`;
            }).join("\n\n");
            return `🎬 รายการภาพยนตร์ที่พบ:\n\n${list}\n\n-------------------------------------\n💡 พิมพ์หมายเลขหนังที่ต้องการจองได้เลยครับ (เช่น พิมพ์ 1)`;
        }
        // ถ้าเป็น Message ตอบกลับทั่วไป
        if (data.message) return data.message;
        if (data.content && data.content[0] && data.content[0].text) return data.content[0].text;
        
        return rawData;
    } catch (e) {
        return rawData;
    }
}

exports.chatWithAI = async (user, userMessage, imageBase64) => {
  try {
    const userId = user.id || "default_user"; 
    console.log(`🚀 Request from user: ${userId}`);

    // 🧠 2. ดึงประวัติเก่ามาใช้
    if (!chatSessions[userId]) {
        chatSessions[userId] = [];
    }
    
    // แปลง History ให้อยู่ใน Format ของ Gemini
    // (Gemini SDK ใช้ { role: 'user'|'model', parts: [{ text: ... }] })
    let history = chatSessions[userId];

    const mcpTools = await client.listTools();
    const googleTools = {
      functionDeclarations: mcpTools.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "OBJECT",
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      })),
    };

    // 🔥 เพิ่ม System Prompt ช่วยเรื่องการแมปเลข
    const extraPrompt = `
    [IMPORTANT MEMORY RULE]
    - If the user selects a number (e.g., "1", "2"), LOOK AT THE PREVIOUS MODEL RESPONSE to find the corresponding movie title.
    - Do NOT search for the number "1" in the database.
    - Map the number to the movie title strictly from the context history.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // แนะนำ 1.5 Flash เพื่อความจำที่ดีกว่า Lite
      systemInstruction: getSystemPrompt(user) + "\n\n" + extraPrompt,
      tools: [googleTools],
    });

    const chat = model.startChat({ history: history });

    let messagePayload = [];
    if (userMessage) messagePayload.push(userMessage);
    if (imageBase64) {
      const imagePart = fileToGenerativePart(imageBase64);
      if (imagePart) messagePayload.push(imagePart);
    }
    if (messagePayload.length === 0) return "กรุณาส่งข้อความหรือรูปภาพ";

    // ส่งข้อความหา AI
    const result = await chat.sendMessage(messagePayload);
    const response = result.response;

    // Handle Function Calling
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("🤖 Gemini is calling tools:", functionCalls.map(fc => fc.name));

      let mcpFinalText = ""; 

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        // Security Check
        if ((functionName === 'add_movie' || functionName === 'delete_movie') && user.role !== 'admin') {
           return "Security Error: Unauthorized";
        }

        const mcpResult = await client.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        // จัดหน้าข้อความ output
        mcpFinalText = forceFormatOutput(mcpResult.content[0].text);
      }

      // 🛑 จุดสำคัญ: บันทึกความจำด้วยมือ (Manual Memory Save)
      // เพราะเรา return ค่าออกไปเลย AI จะไม่รู้ว่ามันตอบอะไรไป เราต้องยัดใส่ History ให้มัน
      if (mcpFinalText) {
        
        // 1. บันทึกสิ่งที่ User ถาม
        chatSessions[userId].push({
            role: "user",
            parts: [{ text: userMessage }]
        });
        
        // 2. บันทึกสิ่งที่เราตอบกลับ (รายการหนัง) -> เพื่อให้ AI จำได้ในรอบหน้า
        chatSessions[userId].push({
            role: "model",
            parts: [{ text: mcpFinalText }]
        });

        return mcpFinalText;
      }
    }

    // กรณีคุยเล่นปกติ (ไม่ได้เรียก Tool)
    // เราต้องอัปเดต History กลับเข้าไปใน chatSessions ด้วย
    // (หมายเหตุ: SDK ไม่ update array ที่เราส่งไปให้ auto เราต้องดึงค่าใหม่ออกมาเองหรือ push เอง)
    // วิธีง่ายสุดคือ push เอง:
    chatSessions[userId].push({
        role: "user",
        parts: [{ text: userMessage }]
    });
    chatSessions[userId].push({
        role: "model",
        parts: [{ text: response.text() }]
    });

    return response.text();

  } catch (error) {
    console.error("Gemini Native Error:", error);
    return "ขออภัยครับ ระบบขัดข้อง: " + error.message;
  }
};