const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");
const fs = require("fs");

// 🎯 ชี้เป้าไปที่ 2 ไฟล์ที่เราเพิ่ง Build เสร็จ
const customerScriptPath = path.resolve(__dirname, "../../../mcp-server/dist/customer.js");
const adminScriptPath = path.resolve(__dirname, "../../../mcp-server/dist/admin.js");

// เช็คว่าหาไฟล์เจอไหม
if (!fs.existsSync(customerScriptPath) || !fs.existsSync(adminScriptPath)) {
    console.error("❌ Error: Could not find MCP Server files. Did you run 'npm run build' in mcp-server?");
    process.exit(1);
}

// สร้าง Transport 2 ตัว แยกกันชัดเจน!
const customerTransport = new StdioClientTransport({
    command: "node",
    args: [customerScriptPath],
    env: process.env 
});

const adminTransport = new StdioClientTransport({
    command: "node",
    args: [adminScriptPath],
    env: process.env 
});

// สร้าง Client 2 ตัว
const customerClient = new Client({ name: "cinema-customer-client", version: "1.0.0" }, { capabilities: {} });
const adminClient = new Client({ name: "cinema-admin-client", version: "1.0.0" }, { capabilities: {} });

async function startMcpClient() {
    try {
        console.log("⏳ Connecting to Split MCP Servers...");
        
        await Promise.all([
            customerClient.connect(customerTransport),
            adminClient.connect(adminTransport)
        ]);

        console.log("✅ Successfully connected to BOTH Customer & Admin MCP Servers!");
        
    } catch (error) {
        console.error("❌ Failed to connect to MCP Servers:", error);
    }
}

module.exports = { startMcpClient, customerClient, adminClient };