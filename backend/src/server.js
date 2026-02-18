require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { startMcpClient } = require('./services/mcpClient');

const PORT = process.env.PORT || 8000; 

// 1. เชื่อมต่อ Database
connectDB();

// 2. เริ่มทำงาน Server เพียงที่เดียว
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    
    // 3. เมื่อ Server รันแล้ว ค่อยเริ่ม MCP Client
    startMcpClient()
        .then(() => {
            console.log("MCP Client started successfully");
        })
        .catch((err) => {
            console.error("Failed to start MCP Client:", err);
        });
});