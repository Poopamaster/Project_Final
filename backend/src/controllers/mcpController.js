const { client } = require("../services/mcpClient");

// Helper function: แปลงผลลัพธ์จาก MCP (Text JSON) เป็น Object ปกติ
const parseMcpResult = (result) => {
    try {
        // MCP ส่งกลับมาเป็น { content: [{ type: 'text', text: 'JSON_STRING' }] }
        const textData = result.content[0].text;
        return JSON.parse(textData);
    } catch (error) {
        console.error("Error parsing MCP result:", error);
        return null;
    }
};

// 1. ค้นหาหนัง (User Tool)
exports.searchMovies = async (req, res) => {
    try {
        const { keyword } = req.query; // รับจาก URL query parameter
        if (!keyword) return res.status(400).json({ error: "Keyword required" });

        const result = await client.callTool({
            name: "search_movies",
            arguments: { keyword }
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. ค้นหาตามประเภท (User Tool)
exports.findMoviesByGenre = async (req, res) => {
    try {
        const { genre } = req.query;
        const result = await client.callTool({
            name: "find_movies_by_genre",
            arguments: { genre }
        });
        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ดูหนังล่าสุด (User Tool)
exports.findLatestMovies = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const result = await client.callTool({
            name: "find_latest_movies",
            arguments: { limit }
        });
        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. เพิ่มหนัง (Admin Tool)
exports.addMovie = async (req, res) => {
    try {
        // รับข้อมูลจาก Body (JSON)
        const { title_th, title_en, genre, start_date, due_date } = req.body;

        const result = await client.callTool({
            name: "add_movie",
            arguments: { 
                title_th, 
                title_en, 
                genre, 
                start_date, 
                due_date 
            }
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ลบหนัง (Admin Tool)
exports.deleteMovie = async (req, res) => {
    try {
        const { id } = req.params; // รับ ID จาก URL Parameter

        const result = await client.callTool({
            name: "delete_movie",
            arguments: { movie_id: id }
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. นับจำนวนหนังทั้งหมด (User Tool)
exports.countTotalMovies = async (req, res) => {
    try {
        const result = await client.callTool({
            name: "count_total_movies",
            arguments: {}
        });

        res.json(parseMcpResult(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};