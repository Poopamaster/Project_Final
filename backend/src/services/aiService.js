// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { client } = require("./mcpClient");
const { getSystemPrompt } = require("../utils/promptGenerator");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🧠 1. ตัวแปรเก็บความจำ (In-Memory Session)
const chatSessions = {}; 

function fileToGenerativePart(base64String) {
  if (!base64String) return null;
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { inlineData: { mimeType: "image/jpeg", data: base64String } };
  }
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
}

// ฟังก์ชันจัดหน้า (Formatter) - เหมือนเดิม
function forceFormatOutput(rawData) {
    try {
        const data = JSON.parse(rawData);
        if (Array.isArray(data)) {
            const list = data.map((m, index) => {
                const title = m.Title || m.title_th + ` (${m.title_en})`; 
                const genre = m.Genre || m.genre || "-";
                const date = m.ReleaseDate || m.ShowingDate || m.start_date || "-";
                return `### ${index + 1}. 🎬 ${title}\n   - 🎭 แนว: ${genre}\n   - 📅 ฉาย: ${date}`;
            }).join("\n\n");
            return `🎬 รายการภาพยนตร์ที่พบ:\n\n${list}\n\n-------------------------------------\n💡 พิมพ์หมายเลขหนังที่ต้องการจองได้เลยครับ (เช่น พิมพ์ 1)`;
        }
        if (data.message) return data.message;
        if (data.content && data.content[0] && data.content[0].text) return data.content[0].text;
        return rawData;
    } catch (e) {
        return rawData;
    }
}

// ✨ 2. ฟังก์ชันหลัก (ปรับแก้ให้รับ allowedToolNames)
// allowedToolNames = Array รายชื่อเครื่องมือที่ผ่านการเช็คสิทธิ์มาจาก Controller แล้ว
exports.chatWithAI = async (user, userMessage, imageBase64, allowedToolNames = []) => {
  try {
    const userId = user.id || "default_user"; 
    console.log(`🚀 Request from user: ${userId} (${user.role})`);
    console.log(`🛡️ Injecting Tools: ${allowedToolNames.join(", ")}`);

    // 🧠 3. ดึงประวัติเก่า
    if (!chatSessions[userId]) {
        chatSessions[userId] = [];
    }
    let history = chatSessions[userId];

    // 🛠️ ENGINEERING HIGHLIGHT: Dynamic Tool Injection 🛠️
    // 1. ดึง Tools ทั้งหมดจาก MCP Server
    const mcpTools = await client.listTools();
    
    // 2. กรอง (Filter) เอาเฉพาะ Tools ที่มีชื่ออยู่ใน allowedToolNames
    const filteredTools = mcpTools.tools.filter(tool => 
        allowedToolNames.includes(tool.name)
    );

    // 3. แปลงร่างเป็น format ของ Google Gemini
    const googleTools = {
      functionDeclarations: filteredTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "OBJECT",
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      })),
    };

    // 🔥 System Prompt + Memory Rule
    const extraPrompt = `
    [CURRENT USER ROLE]: ${user.role.toUpperCase()}
    [IMPORTANT MEMORY RULE]
    - If the user selects a number (e.g., "1", "2"), LOOK AT THE PREVIOUS MODEL RESPONSE.
    - Do NOT search for the number "1" in the database.
    - You only have access to the tools provided. If a user asks for a feature you don't have (like 'delete_movie' for a normal user), politely refuse and say you don't have permission.
    `;

    // 4. สร้าง Model โดยส่งไปแค่ googleTools (ที่กรองแล้ว)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // แนะนำ 1.5 flash เพราะ function calling เสถียรกว่า 2.5-lite
      systemInstruction: getSystemPrompt(user) + "\n\n" + extraPrompt,
      tools: filteredTools.length > 0 ? [googleTools] : [], // ถ้าไม่มี tool เลยก็ไม่ต้องส่ง
    });

    const chat = model.startChat({ history: history });

    let messagePayload = [];
    if (userMessage) messagePayload.push(userMessage);
    if (imageBase64) {
      const imagePart = fileToGenerativePart(imageBase64);
      if (imagePart) messagePayload.push(imagePart);
    }
    if (messagePayload.length === 0) return "กรุณาส่งข้อความหรือรูปภาพ";

    // 🚀 ส่งข้อความหา AI
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

        const mcpResult = await client.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        mcpFinalText = forceFormatOutput(mcpResult.content[0].text);
      }

      // บันทึกความจำ (Manual Memory Save)
      if (mcpFinalText) {
        chatSessions[userId].push({
            role: "user",
            parts: [{ text: userMessage }]
        });
        chatSessions[userId].push({
            role: "model",
            parts: [{ text: mcpFinalText }]
        });
        return mcpFinalText;
      }
    }

    // กรณีคุยปกติ
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