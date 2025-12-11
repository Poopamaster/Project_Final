// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai"); // ✅ ใช้ของ Google โดยตรง
const { client } = require("./mcpClient");
const { getSystemPrompt } = require("../utils/promptGenerator");

// 1. ดึง Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 2. สร้าง Instance ของ Google AI (ไม่ต้องใส่ URL เองแล้ว)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.chatWithAI = async (user, userMessage) => {
  try {
    console.log("🚀 Sending request to Gemini (Native SDK)...");

    // A. แปลง MCP Tools เป็น Format ของ Google
    const mcpTools = await client.listTools();
    
    // Google ใช้ format ต่างจาก OpenAI นิดหน่อย
    const googleTools = {
      functionDeclarations: mcpTools.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "OBJECT", // Google บังคับ type ใหญ่ต้องเป็น OBJECT
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      })),
    };

    // B. ตั้งค่า Model และ System Prompt
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // ใช้รุ่น Flash ฟรีและเร็ว
      systemInstruction: getSystemPrompt(user), // ✅ ใส่ System Prompt ตรงนี้ได้เลย
      tools: [googleTools], // ใส่ Tools เข้าไป
    });

    // C. เริ่มการสนทนา
    const chat = model.startChat({
        // ถ้าอยากให้จำบริบทเก่าๆ ให้ใส่ history ตรงนี้
        history: [] 
    });

    // D. ส่งข้อความหา AI
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    
    // E. เช็คว่า AI สั่งเรียก Tool หรือไม่? (Function Calling)
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("🤖 Gemini is calling tools:", functionCalls.map(fc => fc.name));
      
      // เตรียมอาเรย์สำหรับเก็บผลลัพธ์ที่จะส่งกลับไปให้ AI
      const functionResponses = [];

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        // --- 🔒 SECURITY CHECK ---
        // ป้องกัน User ทั่วไปใช้คำสั่ง Admin
        if ((functionName === 'add_movie' || functionName === 'delete_movie') && user.role !== 'admin') {
             // ส่ง Error กลับไปให้ AI รู้ว่าทำไม่ได้
             functionResponses.push({
                functionResponse: {
                    name: functionName,
                    response: { result: "Security Error: You are not authorized to use this tool." }
                }
             });
             continue; // ข้ามไปรอบถัดไป
        }

        // เรียก MCP Server ของเรา
        const mcpResult = await client.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        // Google ต้องการผลลัพธ์เป็น Object (ไม่ใช่ Text ล้วน)
        let toolOutputData = { result: mcpResult.content[0].text };

        functionResponses.push({
          functionResponse: {
            name: functionName,
            response: toolOutputData
          }
        });
      }

      // F. ส่งผลลัพธ์จาก Tool กลับไปให้ Gemini สรุปเป็นภาษาคน
      if (functionResponses.length > 0) {
        const finalResult = await chat.sendMessage(functionResponses);
        return finalResult.response.text();
      }
    }

    // ถ้าคุยเล่นปกติ (ไม่ได้เรียก Tool)
    return response.text();

  } catch (error) {
    console.error("Gemini Native Error:", error);
    return "ขออภัยครับ ระบบขัดข้อง (AI Error)";
  }
};