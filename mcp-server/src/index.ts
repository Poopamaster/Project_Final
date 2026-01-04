import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { connectDB } from "./db.js";
import { MovieModel } from "./models/movie.js"; 

const server = new McpServer({
  name: "cinema-mcp-server",
  version: "1.0.0",
});

// Helper: แปลงวันที่
const formatDate = (date: Date) => {
  if (!date) return "ไม่ระบุ";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// 🔥 ฟังก์ชันจัดหน้า (Formatter)
// เราจะแปลงข้อมูลเป็น String สวยๆ ที่นี่เลย ไม่ต้องให้ AI ทำ
const formatMovieOutput = (movies: any[]) => {
    if (!movies || movies.length === 0) return "ไม่พบข้อมูลภาพยนตร์ครับ";

    const list = movies.map((m, index) => {
        return `### ${index + 1}. 🎬 ${m.title_th} (${m.title_en})
   - 🎭 แนว: ${m.genre} | ⏳ ${m.duration_min || 0} นาที
   - 📅 ฉาย: ${formatDate(m.start_date)} - ${formatDate(m.due_date)}`;
    }).join("\n\n");

    return `${list}\n\n-------------------------------------\n💡 พิมพ์หมายเลขหนังที่ต้องการจองได้เลยครับ (เช่น พิมพ์ 1)`;
};

// ---------- USER TOOLS ----------

server.tool(
  "search_movies",
  { keyword: z.string().describe("Search keyword for movie title") },
  async ({ keyword }) => {
    await connectDB();
    
    const movies = await MovieModel.find({
      $or: [
        { title_th: { $regex: keyword, $options: "i" } },
        { title_en: { $regex: keyword, $options: "i" } }
      ]
    })
    .limit(5)
    .select("title_th title_en genre duration_min start_date due_date -_id");

    // ❌ เลิกส่ง JSON: return { content: [{ type: "text", text: JSON.stringify(...) }] }
    // ✅ ส่ง Text ที่จัดหน้าแล้ว:
    const formattedText = formatMovieOutput(movies);

    return { 
      content: [{ 
        type: "text", 
        // สั่งกำกับอีกนิดว่าให้ตอบตามนี้เป๊ะๆ
        text: `[SYSTEM: PLEASE DISPLAY THE FOLLOWING TEXT EXACTLY AS IS, DO NOT SUMMARIZE]\n\n${formattedText}` 
      }] 
    };
  }
);

server.tool(
  "find_movies_by_genre",
  { genre: z.string().describe("Genre to search") },
  async ({ genre }) => {
    await connectDB();
    
    const movies = await MovieModel.find({ genre: { $regex: genre, $options: "i" } })
      .limit(5)
      .select("title_th title_en genre duration_min start_date due_date -_id");

    const formattedText = formatMovieOutput(movies);

    return { 
        content: [{ 
            type: "text", 
            text: `[SYSTEM: DISPLAY EXACTLY]\n\n${formattedText}` 
        }] 
    };
  }
);

server.tool(
  "find_latest_movies",
  { limit: z.number().describe("Number of movies").default(5) },
  async ({ limit }) => {
    await connectDB();
    
    const movies = await MovieModel.find()
      .sort({ start_date: -1 })
      .limit(limit)
      .select("title_th title_en genre duration_min start_date due_date -_id");

    const formattedText = formatMovieOutput(movies);

    return { 
        content: [{ 
            type: "text", 
            text: `[SYSTEM: DISPLAY EXACTLY]\n\n${formattedText}` 
        }] 
    };
  }
);

server.tool(
  "reserve_ticket",
  { 
    movie_title: z.string().describe("ชื่อหนัง หรือ หมายเลขหนัง (เช่น '1', 'Minecraft')"),
    seat_count: z.number().describe("จำนวนที่นั่ง").default(1),
    user_name: z.string().describe("ชื่อผู้จอง")
  },
  async ({ movie_title, seat_count, user_name }) => {
    // Return เป็น Text ธรรมดา เพราะเรามีระบบดักที่ aiService แล้ว
    return {
      content: [{ 
        type: "text", 
        text: `✅ จองตั๋วสำเร็จ!\n\n🎬 เรื่อง: ${movie_title}\n🎟️ จำนวน: ${seat_count} ที่นั่ง\n👤 ชื่อผู้จอง: ${user_name}\n\nขอบคุณที่ใช้บริการครับ!` 
      }]
    };
  }
);

// ---------- ADMIN TOOLS (เหมือนเดิม) ----------

server.tool(
  "add_movie",
  {
    title_th: z.string(),
    title_en: z.string(),
    genre: z.string(),
    start_date: z.string(),
    due_date: z.string(),
  },
  async (args) => {
    await connectDB();
    await MovieModel.create(args);
    return { content: [{ type: "text", text: `✅ เพิ่มหนังเรื่อง "${args.title_th}" เรียบร้อยแล้ว` }] };
  }
);

server.tool(
  "delete_movie",
  { movie_id: z.string() },
  async ({ movie_id }) => {
    await connectDB();
    const result = await MovieModel.findByIdAndDelete(movie_id);
    if (!result) return { content: [{ type: "text", text: "❌ ไม่พบ ID หนังที่ต้องการลบ" }] };
    return { content: [{ type: "text", text: `🗑️ ลบหนังเรื่อง "${result.title_th}" ออกจากระบบแล้ว` }] };
  }
);

server.tool(
  "count_total_movies",
  {},
  async () => {
    await connectDB();
    const count = await MovieModel.countDocuments();
    return { content: [{ type: "text", text: `📊 มีหนังทั้งหมด ${count} เรื่องในระบบ` }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cinema MCP Server started (Text-Preformatted Mode)!");
}

main();