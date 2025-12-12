// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { client } = require("./mcpClient");
const { getSystemPrompt } = require("../utils/promptGenerator");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ 1. เพิ่มฟังก์ชันแปลงรูปภาพ (Helper Function)
function fileToGenerativePart(base64String) {
  if (!base64String) return null;

  // แยก Header (data:image/xxx;base64) ออกจากตัวข้อมูล
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    // กรณีส่งมาแต่ base64 ล้วนๆ ไม่มี header ให้เดาว่าเป็น jpeg หรือ return เฉพาะ data
    return {
      inlineData: {
        mimeType: "image/jpeg", // ค่า Default
        data: base64String
      }
    };
  }

  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2]
    }
  };
}

// ✅ 2. รับ parameter imageBase64 เพิ่ม
exports.chatWithAI = async (user, userMessage, imageBase64) => {
  try {
    console.log("🚀 Sending request to Gemini (Native SDK)...");

    // A. แปลง MCP Tools
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

    // B. ตั้งค่า Model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // ✅ แนะนำใช้ 1.5-flash ชัวร์ที่สุดสำหรับ Image + Tools
      systemInstruction: getSystemPrompt(user),
      tools: [googleTools],
    });

    const chat = model.startChat({
        history: [] 
    });

    // ✅ 3. เตรียม Payload (รวมข้อความและรูปภาพ)
    let messagePayload = [];

    // ใส่ข้อความ (ถ้ามี)
    if (userMessage) {
        messagePayload.push(userMessage);
    }

    // ใส่รูปภาพ (ถ้ามี)
    if (imageBase64) {
        console.log("📸 Image detected, processing...");
        const imagePart = fileToGenerativePart(imageBase64);
        if (imagePart) {
            messagePayload.push(imagePart);
        }
    }

    // ป้องกันกรณีส่งมาว่างเปล่าทั้งคู่
    if (messagePayload.length === 0) {
        return "กรุณาส่งข้อความหรือรูปภาพ";
    }

    // D. ส่งข้อความหา AI (ส่งเป็น Array)
    const result = await chat.sendMessage(messagePayload);
    const response = result.response;
    
    // E. เช็ค Function Calling (เหมือนเดิม)
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("🤖 Gemini is calling tools:", functionCalls.map(fc => fc.name));
      
      const functionResponses = [];

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        // Security Check
        if ((functionName === 'add_movie' || functionName === 'delete_movie') && user.role !== 'admin') {
             functionResponses.push({
                functionResponse: {
                    name: functionName,
                    response: { result: "Security Error: You are not authorized to use this tool." }
                }
             });
             continue;
        }

        const mcpResult = await client.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        let toolOutputData = { result: mcpResult.content[0].text };

        functionResponses.push({
          functionResponse: {
            name: functionName,
            response: toolOutputData
          }
        });
      }

      if (functionResponses.length > 0) {
        const finalResult = await chat.sendMessage(functionResponses);
        return finalResult.response.text();
      }
    }

    return response.text();

  } catch (error) {
    console.error("Gemini Native Error:", error);
    return "ขออภัยครับ ระบบขัดข้อง (AI Error): " + error.message;
  }
};