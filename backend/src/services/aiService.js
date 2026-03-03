// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { client } = require("./mcpClient"); // ตรวจสอบ path ให้ถูกต้อง
const { getSystemPrompt } = require("../utils/promptGenerator"); // ตรวจสอบ path ให้ถูกต้อง

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🧠 1. ตัวแปรเก็บความจำ (In-Memory Session)
// หมายเหตุ: ใน Production ควรใช้ Redis หรือ Database
const chatSessions = {};

function fileToGenerativePart(base64String) {
  if (!base64String) return null;
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { inlineData: { mimeType: "image/jpeg", data: base64String } };
  }
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
}

// ฟังก์ชันจัดหน้า (Formatter) - ใช้สำหรับข้อมูล Text ปกติเท่านั้น
function forceFormatOutput(rawData) {
  try {
    const data = JSON.parse(rawData);

    // ถ้าเป็น Visual Data ให้คืนค่าเดิมกลับไปเลย ไม่ต้องจัด format
    if (rawData.includes("::VISUAL::") || data.type) {
      return rawData;
    }

    if (Array.isArray(data)) {
      const list = data.map((m, index) => {
        const title = m.Title || m.title_th + ` (${m.title_en || ''})`;
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

// ✨ 2. ฟังก์ชันหลัก
exports.chatWithAI = async (user, userMessage, imageBase64, allowedToolNames = []) => {
  try {
    const userId = user.id || user._id.toString() || "default_user";
    console.log(`🚀 Request from user: ${userId} (${user.role})`);
    console.log(`🛡️ Injecting Tools: ${allowedToolNames.join(", ")}`);

    // 🧠 3. ดึงประวัติเก่า
    if (!chatSessions[userId]) {
      chatSessions[userId] = [];
    }
    let history = chatSessions[userId];

    // 🛠️ ENGINEERING HIGHLIGHT: Dynamic Tool Injection 🛠️
    const mcpTools = await client.listTools();

    // กรอง (Filter) เอาเฉพาะ Tools ที่มีสิทธิ์ใช้
    const filteredTools = mcpTools.tools.filter(tool =>
      allowedToolNames.includes(tool.name)
    );

    // แปลงร่างเป็น format ของ Google Gemini
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
    
    [ADMIN DATA HANDLING]:
    1. หากได้รับข้อมูล JSON ที่เป็น "รายการภาพยนตร์" (ซึ่งถูกส่งมาจาก API Backend ที่ Parse Excel แล้ว):
       - ให้คุณทำการ "สรุป" ข้อมูลสั้นๆ (เช่น พบหนังใหม่ 5 เรื่อง) 
       - แล้วส่ง Tag Visual สำหรับ Preview ทันที:
         สรุปผล ::VISUAL::{"type": "BULK_IMPORT_GRID", "data": [ข้อมูล JSON นั้น]}
       - **ห้าม** เรียกใช้ tool 'bulk_add_movies' จนกว่า Admin จะพิมพ์ยืนยัน
    
    2. หาก Admin พิมพ์ว่า "✅ ยืนยันการบันทึก" หรือคลิกปุ่มยืนยันจาก Visual Component:
       - ให้ดึงข้อมูลชุดเดิมจากประวัติ (Memory) และเรียกใช้ tool 'bulk_add_movies' ทันที
    
    [IMPORTANT MEMORY RULE]
    - If the user selects a number (e.g., "1", "2"), LOOK AT THE PREVIOUS MODEL RESPONSE.
    - Do NOT search for the number "1" in the database.
    - You only have access to the tools provided. If a user asks for a feature you don't have, politely refuse.
    `;

    // 4. สร้าง Model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // หรือ gemini-2.5-flash-lite ตามโควต้าที่มี
      systemInstruction: getSystemPrompt(user) + "\n\n" + extraPrompt,
      tools: filteredTools.length > 0 ? [googleTools] : [],
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

        // เรียกใช้งาน Tool ผ่าน MCP Client
        const mcpResult = await client.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        const toolOutput = mcpResult.content[0].text;

        // 🔥🔥🔥 [จุดที่แก้ไขสำคัญ] 🔥🔥🔥
        // ตรวจสอบว่า Tool ส่งกลับมาเป็น Visual Component หรือไม่ (มี Tag ::VISUAL::)
        if (toolOutput.includes("::VISUAL::")) {
          console.log("🎨 Visual Layout detected, returning directly.");

          // บันทึก History ก่อน return (เพื่อให้ AI จำได้ว่าส่งอะไรไป)
          chatSessions[userId].push({
            role: "user",
            parts: [{ text: userMessage }]
          });
          chatSessions[userId].push({
            role: "model",
            parts: [{ text: toolOutput }] // บันทึก Raw Visual Data
          });

          // ✅ Return ทันทีเพื่อให้ Frontend ไป Parse เป็น Component
          return toolOutput;
        }
        // 🔥🔥🔥 [จบส่วนแก้ไข] 🔥🔥🔥

        // ถ้าไม่ใช่ Visual ให้เข้า Format ปกติ
        mcpFinalText = forceFormatOutput(toolOutput);
      }

      // บันทึกความจำกรณี Text ปกติ
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

    // กรณีคุยปกติ (ไม่มีการเรียก Tool)
    const botText = response.text();
    chatSessions[userId].push({
      role: "user",
      parts: [{ text: userMessage }]
    });
    chatSessions[userId].push({
      role: "model",
      parts: [{ text: botText }]
    });

    return botText;

  } catch (error) {
    console.error("Gemini Native Error:", error);
    return "ขออภัยครับ ระบบขัดข้อง: " + error.message;
  }
};