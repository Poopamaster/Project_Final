import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { connectDB } from "./db.js";
// ✅ แก้ชื่อไฟล์เป็น M ใหญ่ให้ตรงกับไฟล์จริง
import { MovieModel } from "./models/movie.js"; 

const server = new McpServer({
  name: "cinema-mcp-server",
  version: "1.0.0",
});

// ✅ Helper: ฟังก์ชันแปลงวันที่เป็นภาษาไทย
const formatDate = (date: Date) => {
  if (!date) return "ไม่ระบุ";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ---------- USER TOOLS ----------

server.tool(
  "search_movies",
  { keyword: z.string().describe("Search keyword for movie title") },
  async ({ keyword }) => {
    await connectDB();
    
    // 🛡️ SECURITY: ใช้ .select() เพื่อไม่เอา _id และข้อมูลระบบ
    const movies = await MovieModel.find({
      $or: [
        { title_th: { $regex: keyword, $options: "i" } },
        { title_en: { $regex: keyword, $options: "i" } }
      ]
    })
    .limit(5)
    .select("title_th title_en genre duration_min start_date due_date -_id"); // 👈 ตัด _id ทิ้ง

    // จัด Format ใหม่ให้สวยงามก่อนส่งให้ AI
    const cleanOutput = movies.map(m => ({
        Title: `${m.title_th} (${m.title_en})`,
        Genre: m.genre,
        Duration: `${m.duration_min} นาที`,
        ShowingDate: `${formatDate(m.start_date)} - ${formatDate(m.due_date)}`
    }));

    return { 
        content: [{ 
            type: "text", 
            text: cleanOutput.length > 0 ? JSON.stringify(cleanOutput, null, 2) : "ไม่พบข้อมูลภาพยนตร์ที่ค้นหา"
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
      .select("title_th title_en genre start_date -_id"); // 👈 ตัด _id ทิ้ง

    const cleanOutput = movies.map(m => ({
        Title: `${m.title_th} (${m.title_en})`,
        Genre: m.genre,
        ReleaseDate: formatDate(m.start_date)
    }));

    return { content: [{ type: "text", text: JSON.stringify(cleanOutput, null, 2) }] };
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
      .select("title_th title_en start_date genre -_id"); // 👈 ตัด _id ทิ้ง

    const cleanOutput = movies.map(m => ({
        Title: `${m.title_th} (${m.title_en})`,
        Genre: m.genre,
        ReleaseDate: formatDate(m.start_date)
    }));

    return { content: [{ type: "text", text: JSON.stringify(cleanOutput, null, 2) }] };
  }
);

// ---------- ADMIN TOOLS ----------

server.tool(
  "add_movie",
  {
    title_th: z.string(),
    title_en: z.string(),
    genre: z.string(),
    start_date: z.string(),
    due_date: z.string(),
  },
  async ({ title_th, title_en, genre, start_date, due_date }) => {
    await connectDB();
    
    await MovieModel.create({ title_th, title_en, genre, start_date, due_date });
    
    // ไม่ส่ง Object กลับทั้งหมด (เพราะจะมี _id) ส่งแค่ข้อความยืนยันก็พอ
    return { 
        content: [{ 
            type: "text", 
            text: JSON.stringify({ 
                success: true, 
                message: `เพิ่มหนังเรื่อง "${title_th}" เรียบร้อยแล้ว` 
            }) 
        }] 
    };
  }
);

server.tool(
  "delete_movie",
  { movie_id: z.string() },
  async ({ movie_id }) => {
    await connectDB();
    
    const result = await MovieModel.findByIdAndDelete(movie_id);
    
    if (!result) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, message: "ไม่พบ ID หนังที่ต้องการลบ" }) }] };
    }

    return { 
        content: [{ 
            type: "text", 
            text: JSON.stringify({ 
                success: true, 
                message: `ลบหนังเรื่อง "${result.title_th}" ออกจากระบบแล้ว` 
            }) 
        }] 
    };
  }
);

server.tool(
  "count_total_movies",
  {},
  async () => {
    await connectDB();
    
    const count = await MovieModel.countDocuments();
    
    return { 
        content: [{ 
            type: "text", 
            text: JSON.stringify({ 
                total_movies: count,
                message: `มีหนังทั้งหมด ${count} เรื่องในระบบ`
            }) 
        }] 
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cinema MCP Server started (Secure Mode)!");
}

main();