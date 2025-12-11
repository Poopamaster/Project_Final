require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { startMcpClient } = require('./services/mcpClient');

const PORT = process.env.PORT || 5173; 

// เชื่อมต่อ Database
connectDB();

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

startMcpClient().then(() => {
    // โค้ดเดิมของคุณ
    app.listen(5000, () => {
        console.log("Backend Server is running on port 5000");
    });
});