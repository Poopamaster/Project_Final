// src/tools/adminTools.ts
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";

// สร้าง Zod Schema สำหรับหนัง 1 เรื่อง เพื่อใช้ซ้ำ
const movieSchema = z.object({
    title_th: z.string().describe("ชื่อหนังภาษาไทย"),
    title_en: z.string().describe("ชื่อหนังภาษาอังกฤษ").optional(),
    genre: z.string().describe("หมวดหมู่หนัง เช่น Action, Drama"),
    start_date: z.string().describe("วันที่เริ่มฉาย (ISO Format หรือ YYYY-MM-DD)"),
    due_date: z.string().describe("วันที่สิ้นสุดการฉาย"),
    duration_min: z.number().describe("ความยาวหนังหน่วยเป็นนาที"),
    poster_url: z.string().describe("URL ของรูปโปสเตอร์").optional(),
    language: z.string().default("TH/EN").optional(),
});

export const adminTools = [
    // 1. เพิ่มหนังทีละเรื่อง (เหมือนเดิมแต่ปรับ Schema)
    {
        name: "add_movie",
        description: "เพิ่มหนังใหม่ลงในระบบทีละ 1 เรื่อง",
        args: movieSchema.shape,
        handler: async (args: any) => {
            await connectDB();
            try {
                const preparedMovies = [{
                    ...args,
                    title_en: args.title_en || args.title_th,
                    start_date: new Date(args.start_date),
                    due_date: new Date(args.due_date)
                }];

                // ✅ บันทึกลง DB (insertMany คืนค่าเป็น Array)
                const result = await MovieModel.insertMany(preparedMovies);

                return {
                    content: [{
                        type: "text",
                        // ✅ แก้ตรงนี้: ใช้ result.length เพื่อบอกจำนวนที่บันทึกสำเร็จ
                        text: `🎊 นำเข้าข้อมูลสำเร็จ! เพิ่มหนังทั้งหมด ${result.length} เรื่องลงระบบเรียบร้อยแล้ว`
                    }]
                };
            } catch (error: any) {
                return { content: [{ type: "text", text: `❌ ผิดพลาด: ${error.message}` }] };
            }
        }
    },

    // 🔥 2. ใหม่! เพิ่มหนังครั้งละหลายเรื่อง (สำหรับ Import Excel)
    {
        name: "bulk_add_movies",
        description: "เพิ่มหนังหลายเรื่องพร้อมกันลงในฐานข้อมูล (ใช้สำหรับระบบ Import)",
        args: {
            movies: z.array(movieSchema).describe("รายการหนังทั้งหมดที่จะเพิ่ม")
        },
        handler: async ({ movies }: { movies: any[] }) => {
            await connectDB();
            console.log(`🚀 กำลังนำเข้าหนังจำนวน ${movies.length} เรื่อง...`);

            try {
                // จัดการข้อมูลเบื้องต้นอย่างปลอดภัย
                const preparedMovies = movies.map(m => {
                    // สร้าง Helper Function สำหรับเช็ควันที่ ป้องกัน Invalid Date
                    const parseDateSafe = (dateStr: any) => {
                        if (!dateStr) return new Date(); // ถ้าไม่มีให้ใช้วันนี้ (หรือจะ throw error ก็ได้ถ้าอยากเคร่ง)
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? new Date() : d; // ถ้าแปลงแล้ว Invalid ให้ใช้วันนี้ไปก่อน
                    };

                    return {
                        ...m,
                        title_en: m.title_en || m.title_th,
                        start_date: parseDateSafe(m.start_date), // แปลงอย่างปลอดภัย
                        due_date: parseDateSafe(m.due_date),     // แปลงอย่างปลอดภัย
                        duration_min: Number(m.duration_min) || 120 // ป้องกันกรณีพิมพ์ข้อความลงในช่องเวลา
                    };
                });

                const result = await MovieModel.insertMany(preparedMovies);
                return {
                    content: [{
                        type: "text",
                        text: `🎊 นำเข้าข้อมูลสำเร็จ! เพิ่มหนังทั้งหมด ${result.length} เรื่องลงระบบเรียบร้อยแล้ว`
                    }]
                };
            } catch (error: any) {
                console.error("❌ Bulk Insert Error:", error);
                return {
                    content: [{
                        type: "text",
                        text: `❌ เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${error.message}`
                    }]
                };
            }
        }
    }
];