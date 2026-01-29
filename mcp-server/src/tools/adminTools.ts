// src/tools/adminTools.ts
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";

export const adminTools = [
    {
        name: "add_movie",
        args: {
            title_th: z.string().describe("ชื่อหนังภาษาไทย"),
            title_en: z.string().describe("ชื่อหนังภาษาอังกฤษ").optional(),
            genre: z.string(),
            start_date: z.string(),
            due_date: z.string(),
            duration_min: z.number().describe("ความยาวหนังหน่วยเป็นนาที (REQUIRED: ถ้า Admin ไม่บอก ให้ถาม Admin กลับว่าความยาวหนังกี่นาที อย่าเดาเอง)"),
            poster_url: z.string().describe("URL ของรูปโปสเตอร์").optional(),
        },
        handler: async (args: any) => {
            await connectDB();
            console.log("🔍 ข้อมูลที่ AI ส่งมา:", JSON.stringify(args, null, 2));
            const finalArgs = {
                ...args,
                duration_min: args.duration_min || 120,
                title_en: args.title_en || args.title_th
            };
            try {
                await MovieModel.create(finalArgs);
                return { content: [{ type: "text", text: `✅ บันทึกสำเร็จ! เพิ่มหนัง "${finalArgs.title_th}" (ยาว ${finalArgs.duration_min} นาที)` }] };
            } catch (error: any) {
                console.error("❌ DB Error:", error);
                return { content: [{ type: "text", text: `❌ พังที่ Database: ${error.message}` }] };
            }
        }
    },
    // ... delete_movie, count_total_movies ใส่ต่อตรงนี้
];