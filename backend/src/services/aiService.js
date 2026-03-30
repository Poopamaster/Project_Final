// backend/src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { customerClient, adminClient } = require("./mcpClient");
const { getSystemPrompt } = require("../utils/promptGenerator");
const ChatHistory = require("../models/ChatHistory"); // ✅ ใช้ MongoDB แทน in-memory

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GEMINI_MODELS = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(",").map(m => m.trim())
    : ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

// ✅ จำกัดจำนวน message ที่ส่งให้ Gemini เพื่อประหยัด token
const MAX_HISTORY_MESSAGES = 20;

function fileToGenerativePart(base64String) {
    if (!base64String) return null;
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return { inlineData: { mimeType: "image/jpeg", data: base64String } };
    }
    return { inlineData: { mimeType: matches[1], data: matches[2] } };
}

function forceFormatOutput(rawData) {
    try {
        const data = JSON.parse(rawData);
        if (rawData.includes("::VISUAL::") || data.type) return rawData;
        if (Array.isArray(data)) {
            const list = data.map((m, index) => {
                const title = m.Title || m.title_th + ` (${m.title_en || ''})`;
                const genre = m.Genre || m.genre || "-";
                const date = m.ReleaseDate || m.ShowingDate || m.start_date || "-";
                return `### ${index + 1}. 🎬 ${title}\n   - 🎭 แนว: ${genre}\n   - 📅 ฉาย: ${date}`;
            }).join("\n\n");
            return `🎬 รายการภาพยนตร์ที่พบ:\n\n${list}\n\n-------------------------------------\n💡 พิมพ์หมายเลขหนังที่ต้องการจองได้เลยครับ`;
        }
        if (data.message) return data.message;
        if (data.content && data.content[0] && data.content[0].text) return data.content[0].text;
        return rawData;
    } catch (e) {
        return rawData;
    }
}

// ✅ ดึง history จาก MongoDB และแปลงเป็น format ที่ Gemini ต้องการ
async function getGeminiHistory(userId) {
    const historyDoc = await ChatHistory.findOne({ user: userId });
    if (!historyDoc || historyDoc.messages.length === 0) return [];

    // เอาแค่ MAX_HISTORY_MESSAGES ล่าสุด และต้องเป็นคู่ user-bot เสมอ
    const messages = historyDoc.messages.slice(-MAX_HISTORY_MESSAGES);

    return messages
        .filter(m => m.text) // กรอง message ที่ไม่มี text (เช่น รูปอย่างเดียว)
        .map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));
}

exports.chatWithAI = async (user, userMessage, imageBase64, allowedToolNames = []) => {
    try {
        const userId = user.id || user._id.toString() || "default_user";
        console.log(`🚀 Request from user: ${userId} (${user.role})`);
        console.log(`🛡️ Injecting Tools: ${allowedToolNames.join(", ")}`);

        const activeMcpClient = user.role === 'admin' ? adminClient : customerClient;

        // ✅ ดึง history จาก MongoDB แทน in-memory object
        const history = await getGeminiHistory(userId);

        const mcpTools = await activeMcpClient.listTools();
        const filteredTools = mcpTools.tools.filter(tool => allowedToolNames.includes(tool.name));

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

        const extraPrompt = `
    [CURRENT USER ROLE]: ${user.role.toUpperCase()}
    
    [ADMIN DATA HANDLING]:
    1. หากได้รับข้อมูล JSON ที่เป็น "รายการภาพยนตร์":
       - ให้สรุปข้อมูลสั้นๆ แล้วส่ง Tag Visual ทันที:
         ::VISUAL::{"type": "BULK_IMPORT_GRID", "data": [ข้อมูล JSON นั้น]}
       - ห้ามเรียกใช้ tool 'bulk_add_movies' จนกว่า Admin จะพิมพ์ยืนยัน
    2. หาก Admin พิมพ์ว่า "✅ ยืนยันการบันทึก":
       - ให้ดึงข้อมูลจากประวัติและเรียก 'bulk_add_movies' ทันที

    [TICKET BOOKING RULES]:
    Step 1: search_movie -> Step 2: get_branches -> Step 3: get_available_dates -> Step 4: get_showtimes -> Step 5: select_seat -> Step 6: confirm_booking -> Step 7: issue_ticket
    ห้ามข้ามขั้นตอนเด็ดขาด

    [IMPORTANT MEMORY RULE]
    - หากผู้ใช้พิมพ์ตัวเลข ให้ย้อนดูประวัติข้อความล่าสุดว่าหมายถึงอะไร
    `;

        let messagePayload = [];
        if (userMessage) messagePayload.push(userMessage);
        if (imageBase64) {
            const imagePart = fileToGenerativePart(imageBase64);
            if (imagePart) messagePayload.push(imagePart);
        }
        if (messagePayload.length === 0) return "กรุณาส่งข้อความหรือรูปภาพ";

        for (const currentModel of GEMINI_MODELS) {
            try {
                console.log(`⏳ กำลังพยายามใช้ AI Model: [${currentModel}]`);

                const model = genAI.getGenerativeModel({
                    model: currentModel,
                    systemInstruction: getSystemPrompt(user) + "\n\n" + extraPrompt,
                    tools: filteredTools.length > 0 ? [googleTools] : [],
                });

                const chat = model.startChat({ history });
                const result = await chat.sendMessage(messagePayload);
                const response = result.response;
                const functionCalls = response.functionCalls();

                if (functionCalls && functionCalls.length > 0) {
                    console.log(`🤖 [${currentModel}] is calling tools:`, functionCalls.map(fc => fc.name));

                    let mcpFinalText = "";

                    for (const call of functionCalls) {
                        const functionName = call.name;
                        const functionArgs = call.args;

                        // 🛡️ Security Override (IDOR protection)
                        if (['confirm_booking', 'issue_ticket', 'get_my_bookings'].includes(functionName)) {
                            functionArgs.userId = userId;
                        }

                        const mcpResult = await activeMcpClient.callTool({
                            name: functionName,
                            arguments: functionArgs,
                        });

                        const toolOutput = mcpResult.content[0].text;

                        if (toolOutput.includes("::VISUAL::")) {
                            console.log("🎨 Visual Layout detected, returning directly.");
                            return toolOutput;
                        }

                        mcpFinalText = forceFormatOutput(toolOutput);
                    }

                    if (mcpFinalText) return mcpFinalText;
                }

                return response.text();

            } catch (error) {
                console.error(`⚠️ Model [${currentModel}] ขัดข้อง:`, error.message);

                const isQuotaOrServerError =
                    error.status === 429 || error.message.includes('429') ||
                    error.message.includes('quota') || error.message.includes('exhausted') ||
                    error.message.includes('503') || error.message.includes('high demand') ||
                    error.message.includes('overloaded');

                if (isQuotaOrServerError) {
                    console.log(`🔄 กำลังสลับไปโมเดลสำรอง...`);
                    continue;
                } else {
                    // ✅ ไม่เปิดเผย error.message ให้ user เห็น
                    console.error("Non-quota error:", error.message);
                    return "ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง";
                }
            }
        }

        console.error("🚨 AI Models สำรองทั้งหมดถูกใช้งานเต็มโควต้าแล้ว");
        return "ขออภัยครับ ตอนนี้โควต้า AI ประจำวันถูกใช้งานเต็มทุกช่องทางแล้ว กรุณารอสักครู่แล้วลองใหม่ครับ";

    } catch (error) {
        console.error("System Error:", error);
        return "ขออภัยครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง";
    }
};